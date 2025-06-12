'use client';

import { useState, useEffect, useMemo } from 'react';
import { QurbanEdition as QurbanEditionBase, QurbanOperasional as QurbanOperasionalBase } from '@/types/qurban';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Video from 'yet-another-react-lightbox/plugins/video';

interface AnimalStats {
  type: string;
  count: number;
  total: number;
}

interface SedekahStats {
  via: string;
  count: number;
  total: number;
}

interface OperasionalStats {
  name: string;
  budget: number;
  reality: number;
  percentage: number;
  items: QurbanOperasional[];
}

interface QurbanOperasional extends QurbanOperasionalBase {
  expense?: {
    name: string;
    unit_price: number;
    qty: number;
    total_price: number;
    store: string;
  }[];
}

interface QurbanEdition extends QurbanEditionBase {
  gallery_url?: string;
}

export default function QurbankuPage() {
  const router = useRouter();
  const [editions, setEditions] = useState<QurbanEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [selectedEditionData, setSelectedEditionData] = useState<QurbanEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [editionLoading, setEditionLoading] = useState(false);
  const [animalStats, setAnimalStats] = useState<AnimalStats[]>([]);
  const [sedekahStats, setSedekahStats] = useState<SedekahStats[]>([]);
  const [operasionalStats, setOperasionalStats] = useState<OperasionalStats[]>([]);
  const [selectedOperasional, setSelectedOperasional] = useState<OperasionalStats | null>(null);
  const [report, setReport] = useState({
    editions: 0,
    animals: 0,
    sedekah: 0,
    totalSedekah: 0,
    operasional: 0,
  });
  const [galleryFiles, setGalleryFiles] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryModal, setGalleryModal] = useState<{ open: boolean; url: string; type: string }>({ open: false, url: '', type: '' });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Gallery logic for comma-separated URLs
  const galleryUrls = useMemo(() => {
    if (!selectedEditionData?.gallery_url) return [];
    return selectedEditionData.gallery_url
      .split(',')
      .map(url => url.trim())
      .filter(Boolean)
      .map(url => {
        const ext = url.split('.').pop()?.toLowerCase();
        const type = ext === 'mp4' || ext === 'webm' || ext === 'mov' ? 'video' : 'image';
        return { url, type, name: url.split('/').pop() };
      });
  }, [selectedEditionData?.gallery_url]);

  useEffect(() => {
    checkAuth();
    fetchEditions();
    fetchReport();
  }, [selectedEdition]);

  useEffect(() => {
    const fetchGallery = async () => {
      if (!selectedEditionData?.gallery_url) {
        setGalleryFiles([]);
        setGalleryError(null);
        return;
      }
      setGalleryLoading(true);
      setGalleryError(null);
      try {
        // Use Supabase JS client .list() method
        const folder = selectedEditionData.gallery_url.replace(/^\/+|\/+$/g, '');
        console.log('DEBUG: gallery_url from edition:', selectedEditionData.gallery_url);
        console.log('DEBUG: folder used for .list:', folder);
        const { data: files, error } = await supabase.storage.from('itqonbucket').list(folder, { limit: 100 });
        console.log('DEBUG: .list(folder):', files, 'error:', error);
        if (error) {
          setGalleryFiles([]);
          setGalleryError(error.message);
          return;
        }
        if (!files || files.length === 0) {
          setGalleryFiles([]);
          setGalleryError('No files found in folder.');
          return;
        }
        const galleryFiles = files.filter(f => f.name && !f.name.endsWith('/')).map(f => {
          const ext = f.name.split('.').pop()?.toLowerCase();
          const type = ext === 'mp4' || ext === 'webm' || ext === 'mov' ? 'video' : 'image';
          const url = `https://qmffqsgaqfzprhcusiot.supabase.co/storage/v1/object/public/itqonbucket/${folder}/${f.name}`;
          console.log('DEBUG: file:', f.name, 'url:', url);
          return {
            name: f.name,
            url,
            type,
          };
        });
        setGalleryFiles(galleryFiles);
        setGalleryError(null);
      } catch (e: any) {
        setGalleryFiles([]);
        setGalleryError(e?.message || 'Unknown error');
      } finally {
        setGalleryLoading(false);
      }
    };
    fetchGallery();
  }, [selectedEditionData?.gallery_url]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    }
  };

  const fetchEditions = async () => {
    try {
      const { data, error } = await supabase
        .from('qurban_editions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEditions(data || []);
    } catch (error) {
      console.error('Error fetching editions:', error);
    }
  };

  const formatDate = (date: string) => {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid Date';
      }
      return parsedDate.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getAnimalTypeTranslation = (type: string) => {
    const translations: { [key: string]: string } = {
      'goat': 'Kambing',
      'cow': 'Sapi',
      'sheep': 'Domba',
      'camel': 'Unta',
    };
    return translations[type.toLowerCase()] || type;
  };

  const fetchReport = async () => {
    try {
      setEditionLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Base queries
      let animalsQuery = supabase.from('qurban_animals').select('*');
      let sedekahQuery = supabase.from('qurban_sedekah').select('*');
      let operasionalQuery = supabase.from('qurban_operasional').select('*');
      let editionsQuery = supabase.from('qurban_editions').select('*');

      // Apply edition filter if selected
      if (selectedEdition && selectedEdition !== 'all') {
        animalsQuery = animalsQuery.eq('qurban_edition_id', selectedEdition);
        sedekahQuery = sedekahQuery.eq('qurban_edition_id', selectedEdition);
        operasionalQuery = operasionalQuery.eq('qurban_edition_id', selectedEdition);
        editionsQuery = editionsQuery.eq('id', selectedEdition);
      }

      // Fetch all data
      const [
        { data: editionsData },
        { data: animalsData },
        { data: sedekahData },
        { data: operasionalData }
      ] = await Promise.all([
        editionsQuery,
        animalsQuery,
        sedekahQuery,
        operasionalQuery
      ]);

      // Set selected edition data
      if (selectedEdition !== 'all' && editionsData?.[0]) {
        const edition = editionsData[0];
        // Validate dates before setting
        if (edition.start && edition.end) {
          const startDate = new Date(edition.start);
          const endDate = new Date(edition.end);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            edition.start = startDate.toISOString();
            edition.end = endDate.toISOString();
            setSelectedEditionData(edition);
          } else {
            console.warn('Invalid dates in edition:', edition);
            setSelectedEditionData(null);
          }
        } else {
          console.warn('Missing dates in edition:', edition);
          setSelectedEditionData(null);
        }
      } else {
        setSelectedEditionData(null);
      }

      // Calculate animal stats
      const animalTypeCount = animalsData?.reduce((acc: { [key: string]: { count: number; total: number } }, curr) => {
        const type = curr.type || 'Unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0 };
        }
        acc[type].count += 1;
        acc[type].total += curr.price || 0;
        return acc;
      }, {});

      // Calculate total animals and total price
      const totalAnimals = animalsData?.length || 0;
      const totalPrice = animalsData?.reduce((sum, curr) => sum + (curr.price || 0), 0) || 0;

      setAnimalStats([
        ...Object.entries(animalTypeCount || {}).map(([type, stats]) => ({
          type,
          count: stats.count,
          total: stats.total,
        })),
        {
          type: 'Total',
          count: totalAnimals,
          total: totalPrice,
        }
      ]);

      // Calculate sedekah stats
      const sedekahViaStats = sedekahData?.reduce((acc: { [key: string]: { count: number; total: number } }, curr) => {
        const via = curr.via || 'Unknown';
        if (!acc[via]) {
          acc[via] = { count: 0, total: 0 };
        }
        acc[via].count += 1;
        acc[via].total += curr.total || 0;
        return acc;
      }, {});

      setSedekahStats(
        Object.entries(sedekahViaStats || {}).map(([via, stats]) => ({
          via,
          count: stats.count,
          total: stats.total,
        }))
      );

      // Calculate operasional stats
      const operasionalByName = operasionalData?.reduce((acc: { [key: string]: OperasionalStats }, curr) => {
        const name = curr.name || 'Unknown';
        if (!acc[name]) {
          acc[name] = {
            name,
            budget: 0,
            reality: 0,
            percentage: 0,
            items: [],
          };
        }
        acc[name].budget += curr.budget || 0;
        acc[name].reality += curr.reality || 0;
        acc[name].items.push(curr);
        return acc;
      }, {});

      // Calculate percentages and sort by name
      const operasionalStatsArray = Object.values(operasionalByName || {}).map(stat => ({
        ...stat,
        percentage: (stat.reality / stat.budget) * 100,
      })).sort((a, b) => a.name.localeCompare(b.name));

      setOperasionalStats(operasionalStatsArray);

      const totalSedekah = sedekahData?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

      setReport({
        editions: selectedEdition === 'all' ? editionsData?.length || 0 : 1,
        animals: animalsData?.length || 0,
        sedekah: sedekahData?.length || 0,
        totalSedekah,
        operasional: operasionalData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
      setEditionLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStatusColor = (percentage: number) => {
    return percentage <= 100 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Qurban</h1>
          {selectedEditionData && (
            <div className="mt-2 text-gray-600">
              <p className="font-medium">{selectedEditionData.name}</p>
              <p className="text-sm">
                {formatDate(selectedEditionData.start)} - {formatDate(selectedEditionData.end)}
              </p>
            </div>
          )}
        </div>
        {/* Edition filter as buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedEdition === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEdition('all')}
          >
            All Editions
          </Button>
          {editions.map((edition) => (
            <Button
              key={edition.id}
              variant={selectedEdition === edition.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedEdition(edition.id)}
            >
              {edition.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Editions</span>
          <span className="text-2xl font-bold">{report.editions}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Hewan Qurban</span>
          <span className="text-2xl font-bold">{report.animals}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Sedekah</span>
          <span className="text-2xl font-bold">{report.sedekah}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Total Sedekah</span>
          <span className="text-2xl font-bold">{formatAmount(report.totalSedekah)}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-lg font-semibold">Operasional</span>
          <span className="text-2xl font-bold">{report.operasional}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Tipe Hewan Qurban</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {animalStats.map((stat, index) => (
                <div 
                  key={stat.type} 
                  className={`flex justify-between items-center ${
                    stat.type === 'Total' ? 'pt-3 border-t border-gray-200' : ''
                  }`}
                >
                  <div>
                    <span className="font-medium">
                      {stat.type === 'Total' ? 'Total' : getAnimalTypeTranslation(stat.type)}
                    </span>
                    {stat.type === 'Total' ? (
                      <>
                        <p className="text-lg font-bold">{formatAmount(stat.total)} <span className="text-sm text-gray-500 font-normal">(from {stat.count} Hewan Qurban)</span></p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">{formatAmount(stat.total)}</p>
                    )}
                  </div>
                  {stat.type != 'Total' ? (
                    <>
                  <div className="text-right">
                    <span className="text-lg font-bold">{stat.count}</span>
                  </div>
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Sedekah Via</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sedekahStats.map((stat) => (
                <div key={stat.via} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{stat.via}</span>
                    <p className="text-sm text-gray-500">{stat.count} donations</p>
                  </div>
                  <span className="text-lg font-bold">{formatAmount(stat.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle>Operasional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {operasionalStats.map((stat) => (
                <div key={stat.name} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-base">{stat.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOperasional(stat)}
                      className="flex items-center gap-1 h-8"
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Budget: </span>
                      <span className="font-medium">{formatAmount(stat.budget)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reality: </span>
                      <span className="font-medium">{formatAmount(stat.reality)}</span>
                    </div>
                    <div>
                      <span className={`font-medium ${getStatusColor(stat.percentage)}`}>
                        {stat.percentage.toFixed(1)}% ({stat.percentage < 100 ? 'Under' : stat.percentage === 100 ? 'On' : 'Over'})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOperasional} onOpenChange={() => setSelectedOperasional(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedOperasional?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {selectedOperasional?.items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.status}</p>
                  </div>
                  <Badge className={getStatusColor((item.reality / item.budget) * 100)}>
                    {((item.reality / item.budget) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium">{formatAmount(item.budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reality</p>
                    <p className="font-medium">{formatAmount(item.reality)}</p>
                  </div>
                </div>
                {item.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Description:</p>
                    <div className="bg-white rounded-lg p-3">
                      <div className="space-y-4">
                        {item.description.split('\n\n').map((section, sectionIndex) => {
                          const lines = section.split('\n');
                          const firstLine = lines[0].trim();
                          const isListCheckSection = firstLine.toLowerCase().includes('[lists-check]');
                          const isListSection = firstLine.toLowerCase().includes('[lists]');
                          
                          if (isListCheckSection || isListSection) {
                            // Extract the title from the first line
                            const title = firstLine.replace(/\[lists(-check)?\]/i, '').trim();
                            return (
                              <div key={sectionIndex} className="space-y-2">
                                <p className="font-bold">
                                  {isListCheckSection ? 'Checklist' : 'List'}{title ? ` ${title}` : ''}
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-sm max-h-[80px] overflow-y-auto pr-2">
                                  {lines.slice(1).map((line, index) => {
                                    const name = line.trim();
                                    if (!name) return null;
                                    return (
                                      <div key={index} className="flex items-baseline gap-1 text-left">
                                        {isListCheckSection ? (
                                          <span className="text-green-500 flex-shrink-0">✅</span>
                                        ) : (
                                          <span className="text-gray-500 font-medium flex-shrink-0">{index + 1}.</span>
                                        )}
                                        <span className="whitespace-pre-line text-left">{name}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={sectionIndex} className="text-sm text-gray-600 whitespace-pre-line">
                                {section}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detail Pengeluaran Section */}
                {Array.isArray(item.expense) && item.expense.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold mb-2">Detail Pengeluaran</p>
                    <div className="overflow-x-auto max-h-[150px] overflow-y-auto">
                      <table className="min-w-full border text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-2 py-1">No</th>
                            <th className="border px-2 py-1">Name</th>
                            <th className="border px-2 py-1">Unit Price</th>
                            <th className="border px-2 py-1">Qty</th>
                            <th className="border px-2 py-1">Total Price</th>
                            <th className="border px-2 py-1">Store</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.expense.map((row, idx) => (
                            <tr key={idx}>
                              <td className="border px-2 py-1 text-center">{idx + 1}</td>
                              <td className="border px-2 py-1">{row.name}</td>
                              <td className="border px-2 py-1">{formatAmount(row.unit_price)}</td>
                              <td className="border px-2 py-1 text-center">{row.qty}</td>
                              <td className="border px-2 py-1">{formatAmount(row.total_price)}</td>
                              <td className="border px-2 py-1">{row.store}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Total Expense */}
                    <div className="text-right font-bold mt-2">
                      Total Expense: {item.expense && item.expense.length > 0 ? formatAmount(item.expense.reduce((sum, row) => sum + (row.total_price || 0), 0)) : '-'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Section */}
      {selectedEditionData?.gallery_url && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Gallery</h2>
          {galleryUrls.length === 0 ? (
            <div className="text-gray-500">No gallery files found.</div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
              {galleryUrls.map((file, idx) => (
                <div
                  key={idx}
                  className="mb-4 break-inside-avoid cursor-pointer group relative"
                  onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                >
                  {file.type === 'image' ? (
                    <img src={file.url} alt={file.name} className="w-full mb-2 rounded shadow hover:opacity-80 transition" />
                  ) : (
                    <video src={file.url} className="w-full mb-2 rounded shadow" />
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Lightbox for viewing image/video with next/prev */}
          {lightboxOpen && (
            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              index={lightboxIndex}
              slides={galleryUrls.map(file =>
                file.type === 'image'
                  ? { src: file.url, type: 'image' }
                  : { src: file.url, type: 'video', poster: file.url, sources: [{ src: file.url, type: 'video/mp4' }] }
              )}
              plugins={[Video]}
              on={{ view: ({ index }) => setLightboxIndex(index) }}
            />
          )}
        </div>
      )}
    </div>
  );
} 