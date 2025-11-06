import { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Screen, Property } from '../App';
import { Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { Alert, AlertDescription } from './ui/alert';
import { SuccessAlert } from './help/SuccessAlert';

interface PropertyFormProps {
  property?: Property | null;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onSave?: () => void;
  onPropertyUpdated?: () => void;
}

export function PropertyForm({ property: propFromProps, onNavigate, onLogout, onSave, onPropertyUpdated }: PropertyFormProps) {
  const [property, setProperty] = useState<Property | null>(propFromProps || null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    priceFrom: '',
    areaFrom: '',
    image: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    price: '',
    projectId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Primero intentar obtener de sessionStorage (para edición)
    try {
      const stored = sessionStorage.getItem('editingProperty');
      if (stored) {
        const storedProperty = JSON.parse(stored);
        setProperty(storedProperty);
        sessionStorage.removeItem('editingProperty');
      } else if (propFromProps) {
        setProperty(propFromProps);
      }
    } catch (e) {
      // Ignorar error
    }
  }, [propFromProps]);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        location: property.location || '',
        priceFrom: property.priceFrom?.toString() || '',
        areaFrom: property.areaFrom?.toString() || '',
        image: property.image || '',
        description: property.description || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        area: property.area?.toString() || '',
        price: property.price?.toString() || '',
        projectId: property.projectId || ''
      });
    }
  }, [property]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const propertyData: Omit<Property, 'id'> = {
        name: formData.name,
        location: formData.location,
        priceFrom: parseFloat(formData.priceFrom) || 0,
        areaFrom: parseFloat(formData.areaFrom) || 0,
        image: formData.image,
        description: formData.description,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseFloat(formData.area) || 0,
        price: parseFloat(formData.price) || 0,
        projectId: formData.projectId
      };

      if (property) {
        // Actualizar
        await propertyService.update(property.id, propertyData);
        setShowSuccess(true);
        setTimeout(() => {
          if (onSave) onSave();
          if (onPropertyUpdated) onPropertyUpdated();
          onNavigate('projects');
        }, 2000);
      } else {
        // Crear
        await propertyService.create(propertyData);
        setShowSuccess(true);
        setTimeout(() => {
          if (onSave) onSave();
          if (onPropertyUpdated) onPropertyUpdated();
          onNavigate('projects');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation currentScreen="projects" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('projects')}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
          
          <h1 className="text-3xl text-gray-900 mb-2">
            {property ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h1>
          <p className="text-gray-600">
            {property ? 'Modifica los datos de la propiedad' : 'Ingresa los datos de la nueva propiedad'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showSuccess && (
          <SuccessAlert
            title={`✓ Propiedad ${property ? 'actualizada' : 'creada'} exitosamente`}
            message="La propiedad ha sido guardada en el sistema"
            primaryAction={{
              label: "Ver propiedades",
              onClick: () => {
                setShowSuccess(false);
                onNavigate('projects');
              }
            }}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información de la Propiedad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Proyecto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Torres del Mar"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ej: Miraflores, Lima"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceFrom">Precio Desde (S/) *</Label>
                  <Input
                    id="priceFrom"
                    type="number"
                    value={formData.priceFrom}
                    onChange={(e) => handleInputChange('priceFrom', e.target.value)}
                    placeholder="320000"
                    required
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio (S/) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="320000"
                    required
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaFrom">Área Desde (m²) *</Label>
                  <Input
                    id="areaFrom"
                    type="number"
                    value={formData.areaFrom}
                    onChange={(e) => handleInputChange('areaFrom', e.target.value)}
                    placeholder="85"
                    required
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área (m²) *</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="85"
                    required
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Dormitorios *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    placeholder="3"
                    required
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Baños *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    placeholder="2"
                    required
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">ID del Proyecto</Label>
                  <Input
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    placeholder="proj-1"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image">URL de la Imagen</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descripción del proyecto..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => onNavigate('projects')}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {property ? 'Actualizar' : 'Guardar'} Propiedad
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

