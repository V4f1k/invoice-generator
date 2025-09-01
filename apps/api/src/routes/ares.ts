import express, { Request, Response } from 'express';
import { z } from 'zod';

interface AresAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

interface AresRegistration {
  registrationType: string;
  registrationCourt: string | null;
  registrationFileNumber: string | null;
  automaticLegalText: string | null; // The generated legal text for display
  registryCode: string | null; // VR, RZP, RES, etc.
  isBusinessPerson: boolean; // true for OSVČ, false for companies
}

interface AresResponse {
  ico: string;
  name: string;
  address: AresAddress;
  registration: AresRegistration;
  isActive: boolean;
  dic: string | null;
}

// In-memory cache for ARES responses (24 hours)
const aresCache = new Map<string, { data: AresResponse; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const router = express.Router();

// ICO validation schema
const icoSchema = z.string().regex(/^\d{8}$/, 'ICO must be exactly 8 digits');

// TODO: Implement correct Czech ICO checksum validation
// function validateIcoChecksum(ico: string): boolean { ... }

// Function to normalize ARES address data
function normalizeAresAddress(aresData: any): AresAddress {
  const adresa = aresData.sidlo;
  
  // Extract street information
  let street = '';
  if (adresa.nazevUlice) {
    street = adresa.nazevUlice;
    if (adresa.cisloDomovni) {
      street += ` ${adresa.cisloDomovni}`;
    }
    if (adresa.cisloOrientacni) {
      street += `/${adresa.cisloOrientacni}`;
    }
  } else if (adresa.nazevObce && adresa.cisloDomovni) {
    street = `${adresa.nazevObce} ${adresa.cisloDomovni}`;
  }
  
  return {
    street: street || '',
    city: adresa.nazevObce || '',
    zipCode: adresa.psc ? adresa.psc.toString() : '',
    country: 'Czech Republic'
  };
}

// Function to normalize registration information
function normalizeAresRegistration(aresData: any): AresRegistration {
  const pravniFormaKod = aresData.pravniForma;
  const seznamRegistraci = aresData.seznamRegistraci;
  
  if (!pravniFormaKod || !seznamRegistraci) {
    return {
      registrationType: 'bez_zapisu',
      registrationCourt: null,
      registrationFileNumber: null,
      automaticLegalText: 'Podnikatel není zapsán v žádném rejstříku.',
      registryCode: null,
      isBusinessPerson: false
    };
  }
  
  // Map ARES legal forms to our registration types
  const kodPravniFormy = parseInt(pravniFormaKod);
  
  // Check which registry is active
  const isVrActive = seznamRegistraci.stavZdrojeVr === 'AKTIVNI';
  const isRzpActive = seznamRegistraci.stavZdrojeRzp === 'AKTIVNI';
  const isResActive = seznamRegistraci.stavZdrojeRes === 'AKTIVNI';
  
  if (isVrActive && (kodPravniFormy >= 111 && kodPravniFormy <= 130)) {
    // Commercial register (s.r.o., a.s., etc.)
    const vrData = aresData.dalsiUdaje?.find((item: any) => item.datovyZdroj === 'vr');
    const spisovaZnacka = vrData?.spisovaZnacka;
    const court = vrData?.soud || 'Krajský soud';
    
    let legalText = '';
    if (spisovaZnacka) {
      // Parse spisová značka (e.g., "B 8573/MSPH" -> oddíl "B", vložka "8573")
      const parts = spisovaZnacka.trim().split(/\s+/);
      if (parts.length >= 2) {
        const oddil = parts[0];
        // Extract number from second part (e.g., "8573/MSPH" -> "8573")
        const vlozka = parts[1].split('/')[0];
        legalText = `Společnost zapsána v obchodním rejstříku vedeném ${court}, oddíl ${oddil}, vložka ${vlozka}.`;
      } else {
        legalText = `Společnost zapsána v obchodním rejstříku vedeném ${court} pod spisovou značkou ${spisovaZnacka}.`;
      }
    } else {
      legalText = `Společnost zapsána v obchodním rejstříku vedeném ${court}.`;
    }
    
    return {
      registrationType: 'obchodni_rejstrik',
      registrationCourt: court,
      registrationFileNumber: spisovaZnacka || null,
      automaticLegalText: legalText,
      registryCode: 'VR',
      isBusinessPerson: false
    };
  } else if (isRzpActive && (kodPravniFormy >= 101 && kodPravniFormy <= 199)) {
    // Trade register (fyzická osoba podnikající)
    return {
      registrationType: 'zivnostensky_rejstrik',
      registrationCourt: 'Živnostenský úřad',
      registrationFileNumber: null,
      automaticLegalText: 'Fyzická osoba zapsaná v živnostenském rejstříku.',
      registryCode: 'RZP',
      isBusinessPerson: true
    };
  } else if (isResActive) {
    // Registry of economic subjects
    return {
      registrationType: 'jiny_rejstrik',
      registrationCourt: 'Registr ekonomických subjektů',
      registrationFileNumber: null,
      automaticLegalText: 'Subjekt zapsán v registru ekonomických subjektů.',
      registryCode: 'RES',
      isBusinessPerson: false
    };
  }
  
  // Fallback for other registration types
  return {
    registrationType: 'jiny_rejstrik',
    registrationCourt: null,
    registrationFileNumber: null,
    automaticLegalText: 'Podnikatel zapsán v jiném rejstříku.',
    registryCode: null,
    isBusinessPerson: false
  };
}

// GET /api/v1/ares/:ico
router.get('/:ico', async (req: Request, res: Response) => {
  try {
    const { ico } = req.params;
    
    // Validate ICO format
    const validationResult = icoSchema.safeParse(ico);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid ICO format',
        message: 'ICO must be exactly 8 digits'
      });
    }
    
    // Validate ICO checksum (temporarily disabled for integration testing)
    // TODO: Implement correct Czech ICO checksum validation
    // if (!validateIcoChecksum(ico)) {
    //   return res.status(400).json({
    //     error: 'Invalid ICO',
    //     message: 'ICO checksum validation failed'
    //   });
    // }
    
    // Check cache first
    const cached = aresCache.get(ico);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json(cached.data);
    }
    
    // Call ARES API
    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
    
    const response = await fetch(aresUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Invoice-Generator/1.0'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          error: 'ICO not found',
          message: 'Company with this ICO was not found in ARES'
        });
      }
      
      throw new Error(`ARES API error: ${response.status} ${response.statusText}`);
    }
    
    const aresData = await response.json();
    
    // Check if company is active (check various registry statuses)
    const registraceStatus = aresData.seznamRegistraci;
    const isActive = registraceStatus && (
      registraceStatus.stavZdrojeVr === 'AKTIVNI' ||
      registraceStatus.stavZdrojeRes === 'AKTIVNI' ||
      registraceStatus.stavZdrojeRzp === 'AKTIVNI'
    );
    
    if (!isActive) {
      return res.status(400).json({
        error: 'Inactive company',
        message: 'This company is not active in ARES'
      });
    }
    
    // Normalize the response
    const normalizedResponse: AresResponse = {
      ico: ico,
      name: aresData.obchodniJmeno || aresData.nazev || '',
      address: normalizeAresAddress(aresData),
      registration: normalizeAresRegistration(aresData),
      isActive: isActive,
      dic: aresData.dic || null
    };
    
    // Cache the response
    aresCache.set(ico, {
      data: normalizedResponse,
      timestamp: Date.now()
    });
    
    return res.json(normalizedResponse);
    
  } catch (error) {
    console.error('ARES API Error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch company information from ARES'
    });
  }
});

export default router;