'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Upload, X, ImageIcon } from 'lucide-react';
import { AdminGuard } from '@/components/auth/admin-guard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { Rank } from '@/types/profile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminRanksPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string }>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user } = useAuth();

  // Formulaire
  const [formData, setFormData] = useState({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    level: 1,
    icon_url: '',
  });

  const fetchRanks = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Vous devez être connecté');
      }

      const response = await fetch('/api/admin/ranks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des ranks');
      }

      const data = await response.json();
      setRanks(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_fr: '',
      description_en: '',
      description_fr: '',
      level: 1,
      icon_url: '',
    });
    setEditingRank(null);
  };

  const openDialog = (rank?: Rank) => {
    if (rank) {
      setFormData({
        name_en: rank.name_en,
        name_fr: rank.name_fr,
        description_en: rank.description_en || '',
        description_fr: rank.description_fr || '',
        level: rank.level,
        icon_url: rank.icon_url || '',
      });
      setEditingRank(rank);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'ranks');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      setFormData({ ...formData, icon_url: data.data.url });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const saveRank = async () => {
    setSaving(true);
    setResult(null);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const method = editingRank ? 'PUT' : 'POST';
      const body = editingRank
        ? { ...formData, id: editingRank.id }
        : formData;

      const response = await fetch('/api/admin/ranks', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      setResult(data);
      closeDialog();
      fetchRanks(); // Rafraîchir la liste
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const deleteRank = async (rankId: string) => {
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/admin/ranks?id=${rankId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      const data = await response.json();
      setResult(data);
      fetchRanks(); // Rafraîchir la liste
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Gestion des Ranks
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Créer, modifier et supprimer les rangs des utilisateurs
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {ranks.length} rank{ranks.length !== 1 ? 's' : ''} au total
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Rank
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRank ? 'Modifier le Rank' : 'Créer un nouveau Rank'}
                </DialogTitle>
                <DialogDescription>
                  {editingRank
                    ? 'Modifiez les informations du rank ci-dessous.'
                    : 'Remplissez les informations pour créer un nouveau rank.'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_en">Nom (Anglais) *</Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="Warrior"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_fr">Nom (Français) *</Label>
                    <Input
                      id="name_fr"
                      value={formData.name_fr}
                      onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                      placeholder="Guerrier"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description (Anglais)</Label>
                    <textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      placeholder="Strong and courageous..."
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_fr">Description (Français)</Label>
                    <textarea
                      id="description_fr"
                      value={formData.description_fr}
                      onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                      placeholder="Fort et courageux..."
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau *</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icône du rank</Label>
                    <div className="space-y-2">
                      {formData.icon_url && (
                        <div className="flex items-center gap-2 p-2 border rounded-lg">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden">
                            <img
                              src={formData.icon_url}
                              alt="Rank icon"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <ImageIcon className="w-4 h-4 text-muted-foreground hidden" />
                          </div>
                          <span className="text-sm text-muted-foreground truncate flex-1">
                            {formData.icon_url.split('/').pop()}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ ...formData, icon_url: '' })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          id="icon_url"
                          value={formData.icon_url}
                          onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                          placeholder="URL de l'icône ou upload..."
                          className="flex-1"
                        />
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingImage}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingImage}
                            className="w-24"
                          >
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formats acceptés: JPG, PNG, GIF. Taille max: 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button onClick={saveRank} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    editingRank ? 'Modifier' : 'Créer'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Messages */}
        {result && (
          <Alert className="border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-200">
            <AlertTitle className="text-green-800 dark:text-green-200">Succès</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-200">{result.message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-200">
            <AlertTitle className="text-red-800 dark:text-red-200">Erreur</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Liste des ranks */}
        <div className="grid gap-4">
          {ranks.map((rank) => (
            <Card key={rank.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {rank.icon_url ? (
                        <>
                          <img
                            src={rank.icon_url}
                            alt={rank.name_fr}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <ImageIcon className="w-6 h-6 text-muted-foreground hidden" />
                        </>
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{rank.name_fr} / {rank.name_en}</h3>
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          Niveau {rank.level}
                        </span>
                      </div>
                      {rank.description_fr && (
                        <p className="text-sm text-muted-foreground">{rank.description_fr}</p>
                      )}
                      {rank.description_en && (
                        <p className="text-sm text-muted-foreground text-right">{rank.description_en}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(rank)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le rank "{rank.name_fr}" ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRank(rank.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {ranks.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun rank trouvé.</p>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
