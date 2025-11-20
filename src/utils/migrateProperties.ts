/**
 * Script para migrar las propiedades mock existentes a Supabase
 * Ejecutar una vez después de crear las tablas
 */

import { propertyService } from '../services/propertyService';
import { Property } from '../App';

/**
 * Propiedades distribuidas en diferentes rangos de precios
 * para probar todos los rangos de bonos BBP del Nuevo Crédito Mivivienda
 * 
 * Rangos BBP:
 * - Rango 1: S/ 68,800 - S/ 98,100 → Bono: S/ 27,400
 * - Rango 2: S/ 98,101 - S/ 146,900 → Bono: S/ 22,800
 * - Rango 3: S/ 146,901 - S/ 244,600 → Bono: S/ 20,900
 * - Rango 4: S/ 244,601 - S/ 362,100 → Bono: S/ 7,800
 * - Rango 5: S/ 362,101 - S/ 488,800 → Bono: S/ 0 (sigue siendo Mivivienda)
 * - Mayor a S/ 488,800: Crédito Tradicional (sin bono)
 */
const mockProperties: Omit<Property, 'id'>[] = [
    // PRECIO MUY BAJO (Fuera del límite mínimo del Rango 1: menor a S/ 68,800)
    {
        name: 'Residencial San Felipe',
        location: 'Jesús María, Lima',
        priceFrom: 55000,
        areaFrom: 42,
        image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTkzNzExMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Departamento económico en zona céntrica. Precio por debajo del límite mínimo para BBP (S/ 68,800).',
        bedrooms: 2,
        bathrooms: 1,
        area: 42,
        price: 55000,
        projectId: 'proj-precio-bajo'
    },

    // RANGO 1: S/ 68,800 - S/ 98,100 (Bono: S/ 27,400)
    {
        name: 'Conjunto Habitacional Los Olivos',
        location: 'Los Olivos, Lima',
        priceFrom: 75000,
        areaFrom: 48,
        image: 'https://images.unsplash.com/photo-1504202302068-15fc2055f7f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvdXNpbmclMjBwcm9qZWN0fGVufDF8fHx8MTc1OTQzNjA1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Departamentos modernos en zona consolidada. Califica para Bono del Buen Pagador (BBP) de S/ 27,400.',
        bedrooms: 2,
        bathrooms: 1,
        area: 48,
        price: 75000,
        projectId: 'proj-olivos-rango1'
    },
    {
        name: 'Residencial Villa Los Álamos',
        location: 'San Juan de Lurigancho, Lima',
        priceFrom: 90000,
        areaFrom: 55,
        image: 'https://images.unsplash.com/photo-1758193431393-0aead94a6a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kbyUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc1OTQzNjA1MHww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Casas de 2 pisos con áreas verdes. Aplica BBP máximo de S/ 27,400.',
        bedrooms: 3,
        bathrooms: 2,
        area: 55,
        price: 90000,
        projectId: 'proj-sjl-rango1'
    },

    // RANGO 2: S/ 98,101 - S/ 146,900 (Bono: S/ 22,800)
    {
        name: 'Condominio Villa El Salvador',
        location: 'Villa El Salvador, Lima',
        priceFrom: 120000,
        areaFrom: 62,
        image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTkzNzExMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Departamentos con áreas comunes y seguridad. BBP de S/ 22,800 aplicable.',
        bedrooms: 2,
        bathrooms: 2,
        area: 62,
        price: 120000,
        projectId: 'proj-ves-rango2'
    },
    {
        name: 'Residencial Chorrillos del Sur',
        location: 'Chorrillos, Lima',
        priceFrom: 140000,
        areaFrom: 70,
        image: 'https://images.unsplash.com/photo-1504202302068-15fc2055f7f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvdXNpbmclMjBwcm9qZWN0fGVufDF8fHx8MTc1OTQzNjA1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Casas con jardín y cochera. BBP de S/ 22,800 disponible.',
        bedrooms: 3,
        bathrooms: 2,
        area: 70,
        price: 140000,
        projectId: 'proj-chorrillos-rango2'
    },

    // RANGO 3: S/ 146,901 - S/ 244,600 (Bono: S/ 20,900)
    {
        name: 'Conjunto Habitacional Surco Norte',
        location: 'Santiago de Surco, Lima',
        priceFrom: 200000,
        areaFrom: 80,
        image: 'https://images.unsplash.com/photo-1758193431393-0aead94a6a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kbyUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc1OTQzNjA1MHww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Residencial en zona residencial consolidada. BBP de S/ 20,900 aplicable.',
        bedrooms: 3,
        bathrooms: 2,
        area: 80,
        price: 200000,
        projectId: 'proj-surco-rango3'
    },

    // RANGO 4: S/ 244,601 - S/ 362,100 (Bono: S/ 7,800)
    {
        name: 'Torres del Mar',
        location: 'Miraflores, Lima',
        priceFrom: 300000,
        areaFrom: 85,
        image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTkzNzExMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Exclusivos departamentos con vista al mar. BBP reducido de S/ 7,800.',
        bedrooms: 3,
        bathrooms: 2,
        area: 85,
        price: 300000,
        projectId: 'proj-miraflores-rango4'
    },

    // RANGO 5: S/ 362,101 - S/ 488,800 (Bono: S/ 0, pero sigue siendo Mivivienda)
    {
        name: 'Residencial El Olivar',
        location: 'San Isidro, Lima',
        priceFrom: 425000,
        areaFrom: 95,
        image: 'https://images.unsplash.com/photo-1504202302068-15fc2055f7f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvdXNpbmclMjBwcm9qZWN0fGVufDF8fHx8MTc1OTQzNjA1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Elegantes residencias cerca al Parque El Olivar. Crédito Mivivienda pero sin bono BBP.',
        bedrooms: 3,
        bathrooms: 2,
        area: 95,
        price: 425000,
        projectId: 'proj-sanisidro-rango5'
    },

    // PRECIO MUY ALTO (Mayor a S/ 488,800: Crédito Tradicional sin bono)
    {
        name: 'Torre Las Palmas',
        location: 'San Isidro, Lima',
        priceFrom: 750000,
        areaFrom: 130,
        image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTkzNzExMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Penthouse de lujo con terraza y vista panorámica. Crédito Hipotecario Tradicional (no califica para Mivivienda, precio excede S/ 488,800).',
        bedrooms: 4,
        bathrooms: 3,
        area: 130,
        price: 750000,
        projectId: 'proj-tradicional-alto'
    }
];

/**
 * Migrar propiedades mock a Supabase
 * Solo migra si no existen propiedades en la BD o si hay menos de 9
 * Evita duplicados verificando por projectId
 */
export async function migrateProperties(): Promise<void> {
    try {
        // Verificar propiedades existentes
        const existing = await propertyService.getAll();

        // Si ya hay exactamente 9 propiedades, no migrar
        if (existing.length >= 9) {
            console.log(`Ya existen ${existing.length} propiedades en la BD. No se migrarán las propiedades mock.`);
            return;
        }

        // Obtener projectIds existentes para evitar duplicados
        const existingProjectIds = new Set(existing.map(p => p.projectId).filter(Boolean));

        // Filtrar propiedades que no existen (por projectId)
        const propertiesToMigrate = mockProperties.filter(
            prop => !existingProjectIds.has(prop.projectId)
        );

        if (propertiesToMigrate.length === 0) {
            console.log('Todas las propiedades ya existen en la BD.');
            return;
        }

        // Migrar solo las propiedades que no existen
        console.log(`Migrando ${propertiesToMigrate.length} propiedades nuevas a Supabase...`);
        for (const property of propertiesToMigrate) {
            await propertyService.create(property);
            console.log(`✓ Migrada: ${property.name}`);
        }

        console.log(`✅ Migración completada exitosamente. Total de propiedades: ${existing.length + propertiesToMigrate.length}`);
    } catch (error) {
        console.error('❌ Error al migrar propiedades:', error);
        throw error;
    }
}

