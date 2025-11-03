'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SelectIcon } from '@radix-ui/react-select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Achievement {
  id: string;
  name_fr: string;
  category: string;
  description: string;
  icon_url: string;
  is_active: boolean;
}

export default function RewardsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchAchievements() {
      try {
        if (!user) return;

        // Récupérer toutes les récompenses avec leur statut
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('category');

        if (error) throw error;

        if (data) {
          // Vérifier que les données correspondent à notre interface Achievement
          const validatedAchievements: Achievement[] = data
            .filter((item: any) => {
              return typeof item.id === 'string' &&
                     typeof item.name_fr === 'string' &&
                     typeof item.category === 'string' &&
                     typeof item.description === 'string' &&
                     typeof item.icon_url === 'string' &&
                     typeof item.is_active === 'boolean';
            })
            .map((item: any) => ({
              id: item.id,
              name_fr: item.name_fr,
              category: item.category,
              description: item.description,
              icon_url: item.icon_url,
              is_active: item.is_active
            }));

          setAchievements(validatedAchievements);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des récompenses:', error);
        toast.error('Erreur lors du chargement des récompenses');
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [user]);

  // Filtrer les récompenses
  const filteredAchievements = achievements.filter(achievement => {
    const matchesStatus = activeTab === 'all' || 
      (activeTab === 'active' && achievement.is_active) || 
      (activeTab === 'inactive' && !achievement.is_active);
    
    const matchesCategory = categoryFilter === 'all' || achievement.category === categoryFilter;
    
    const matchesSearch = achievement.name_fr.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Extraire les catégories uniques pour le filtre
  const uniqueCategories = Array.from(new Set(achievements.map(a => a.category)));

  const handleStatusChange = (value: string) => {
    setActiveTab(value as 'all' | 'active' | 'inactive');
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === 'all' ? 'all' : value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mes Récompenses</h1>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <Input
          placeholder="Rechercher une récompense..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Filtre par statut */}
        <div>
          <Select value={activeTab} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les statuts" />
              <SelectIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Activées</SelectItem>
              <SelectItem value="inactive">Désactivées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par catégorie */}
        <div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toutes les catégories" />
              <SelectIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des récompenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          filteredAchievements.map(achievement => (
            <div key={achievement.id} className="bg-card rounded-lg p-4 border">
              <div className="flex items-center gap-4">
                <img 
                  src={achievement.icon_url} 
                  alt={achievement.name_fr}
                  className="h-12 w-12 rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{achievement.name_fr}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.category}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {achievement.description}
                  </p>
                </div>
                <Badge
                  variant={achievement.is_active ? "default" : "outline"}
                  className={`px-3 py-1 text-xs ${achievement.is_active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {achievement.is_active ? 'Activée' : 'Désactivée'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
