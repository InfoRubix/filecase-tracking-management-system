'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  ArrowRightOnRectangleIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
  PencilIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BanknotesIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface RackData {
  rack: string;
  kotakNumbers: KotakData[];
}

interface KotakData {
  kotak: string;
  fileCount: number;
}

interface FileCase {
  id: string;
  year: string;
  category: string;
  type: string;
  kotak: string;
  reffile: string;
  clientname: string;
  phoneClient: string;
  barcodeno: string;
  safekeeping: string;
  agentdetails: string;
  pic: string;
  bank: string;
  location: string;
  status?: 'Active' | 'Inactive' | 'Archive'; // Computed field based on year
}

export default function RacksPage() {
  const [racks, setRacks] = useState<RackData[]>([]);
  const [files, setFiles] = useState<FileCase[]>([]);
  const [expandedRack, setExpandedRack] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedKotak, setSelectedKotak] = useState<string | null>(null);
  const [kotakFiles, setKotakFiles] = useState<FileCase[]>([]);
  const [viewingFile, setViewingFile] = useState<FileCase | null>(null);
  const [editingFile, setEditingFile] = useState<FileCase | null>(null);
  const [updateForm, setUpdateForm] = useState({ location: '' });
  const [showAddRackModal, setShowAddRackModal] = useState(false);
  const [showAddKotakModal, setShowAddKotakModal] = useState(false);
  const [showAddBoxToRackModal, setShowAddBoxToRackModal] = useState(false);
  const [selectedRackForKotak, setSelectedRackForKotak] = useState('');
  const [newRackForm, setNewRackForm] = useState({ rack: '' });
  const [newKotakForm, setNewKotakForm] = useState({ kotak: '' });
  const [addBoxToRackForm, setAddBoxToRackForm] = useState({ rack: '', kotak: '' });
  const [availableKotakNumbers, setAvailableKotakNumbers] = useState<string[]>([]);
  const [isSubmittingRack, setIsSubmittingRack] = useState(false);
  const [isSubmittingKotak, setIsSubmittingKotak] = useState(false);
  const [isSubmittingBoxToRack, setIsSubmittingBoxToRack] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [deletingRack, setDeletingRack] = useState<string | null>(null);
  const [deletingKotak, setDeletingKotak] = useState<string | null>(null);
  const [deletingBoxOnly, setDeletingBoxOnly] = useState<string | null>(null);
  const [showUnusedBoxes, setShowUnusedBoxes] = useState(false);

  // Function to get available kotak numbers from API
  const getAvailableKotakNumbers = async () => {
    try {
      const response = await fetch('/api/boxes/available');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      } else {
        console.error('Failed to get available boxes:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching available boxes:', error);
      return [];
    }
  };
  const router = useRouter();


  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const authResponse = await fetch('/api/auth/verify');
      if (!authResponse.ok) {
        router.push('/admin');
        return;
      }

      // Load RACK_LOOKUP data, file data, and available boxes in parallel
      const [racksResponse, filesResponse, availableBoxesResponse] = await Promise.all([
        fetch('/api/racks'),
        fetch('/api/files/all'),
        fetch('/api/boxes/available')
      ]);

      const racksResult = await racksResponse.json();
      const filesResult = await filesResponse.json();
      const availableBoxesResult = await availableBoxesResponse.json();
      
      console.log('API Response - Racks:', racksResult);
      console.log('API Response - Files:', filesResult);
      console.log('API Response - Available Boxes:', availableBoxesResult);
      
      let allFiles: FileCase[] = [];
      
      if (filesResult.success && Array.isArray(filesResult.data)) {
        console.log('Raw file data sample:', filesResult.data.slice(0, 3));
        
        // Map file data with comprehensive field name handling
        allFiles = filesResult.data.map((file: any) => {
          const mappedFile = {
            ...file,
            id: file.id || file.ID || '',
            year: file.year || file.YEAR || '',
            category: file.category || file.CATEGORY || '',
            type: file.type || file.TYPE || '',
            kotak: file.kotak || file.KOTAK || '',
            reffile: file.reffile || file['REF FILE'] || file.REF_FILE || file.refFile || '',
            clientname: file.clientname || file['CLIENT NAME'] || file.CLIENT_NAME || file.clientName || '',
            phoneClient: file.phoneClient || file['NO. PHONE CLIENT'] || file.NO_PHONE_CLIENT || '',
            barcodeno: file.barcodeno || file['BARCODE NO'] || file.BARCODE_NO || '',
            safekeeping: file.safekeeping || file.SAFEKEEPING || '',
            agentdetails: file.agentdetails || file['AGENT DETAILS'] || file.AGENT_DETAILS || '',
            pic: file.pic || file.PIC || '',
            bank: file.bank || file.BANK || '',
            location: file.location || file.LOCATION || ''
          };
          
          // Compute status based on year with robust error handling
          try {
            const currentYear = new Date().getFullYear();
            let fileYear = currentYear; // Default to current year
            
            // Safely parse year
            if (mappedFile.year && mappedFile.year.toString().trim()) {
              const yearString = mappedFile.year.toString().trim();
              const parsedYear = parseInt(yearString);
              
              // Validate year is reasonable (between 1980 and current year + 1)
              if (!isNaN(parsedYear) && parsedYear >= 1980 && parsedYear <= currentYear + 1) {
                fileYear = parsedYear;
              }
            }
            
            const age = currentYear - fileYear;
            
            if (age <= 7) {
              mappedFile.status = 'Active';
            } else if (age <= 10) {
              mappedFile.status = 'Inactive';
            } else {
              mappedFile.status = 'Archive';
            }
          } catch (error) {
            console.error(`Error calculating status for file ${mappedFile.reffile}:`, error);
            mappedFile.status = 'Active'; // Default fallback
          };
          
          // Debug the first few files to see the mapping
          if (filesResult.data.indexOf(file) < 3) {
            console.log('Original file:', file);
            console.log('Mapped file:', mappedFile);
          }
          
          return mappedFile;
        });
        
        setFiles(allFiles);
        console.log(`Total files loaded: ${allFiles.length}`);
        console.log('Sample mapped files:', allFiles.slice(0, 3));
      } else {
        console.log('No file data or invalid format:', filesResult);
      }

      if (racksResult.success && Array.isArray(racksResult.data)) {
        // Use RACK_LOOKUP data to build the complete rack structure
        const rackLookupData = racksResult.data;
        console.log('RACK_LOOKUP data:', rackLookupData);
        
        // Group RACK_LOOKUP data by rack
        const rackMap = new Map<string, { kotakNumbers: Map<string, { fileCount: number }> }>();
        
        rackLookupData.forEach((item: any) => {
          const rack = (item.rack || item.Rack || item.RACK || '').toString().trim();
          const kotak = (item.kotak || item.Kotak || item.KOTAK || '').toString().trim();
          
          console.log('Processing RACK_LOOKUP item:', { rack, kotak, originalItem: item });
          
          if (rack) {
            // Always add the rack to the map if it exists
            if (!rackMap.has(rack)) {
              rackMap.set(rack, { kotakNumbers: new Map() });
            }
            
            // Add kotak only if it exists
            if (kotak) {
              rackMap.get(rack)?.kotakNumbers.set(kotak, { fileCount: 0 });
            }
          }
        });

        // Count files in each kotak (regardless of category)
        if (allFiles.length > 0) {
          console.log('All files for matching:', allFiles.slice(0, 3)); // Show first 3 files for debugging
          
          rackMap.forEach((rackData, rackName) => {
            rackData.kotakNumbers.forEach((kotakData, kotakNumber) => {
              const filesInKotak = allFiles.filter(file => {
                const fileKotak = (file.kotak || '').toString().trim();
                const targetKotak = (kotakNumber || '').toString().trim();
                
                const kotakMatch = fileKotak === targetKotak;
                
                if (kotakMatch) {
                  console.log(`Kotak ${targetKotak} - File: ${file.reffile}, FileCategory: "${file.category}", KotakMatch: ${kotakMatch}`);
                }
                
                return kotakMatch;
              });
              
              kotakData.fileCount = filesInKotak.length;
              console.log(`Kotak ${kotakNumber} in rack ${rackName}: ${filesInKotak.length} files (all categories)`);
            });
          });
        }

        console.log('Processed rackMap with file counts:', rackMap);

        // Convert to array format with all kotak from RACK_LOOKUP
        const racksData: RackData[] = Array.from(rackMap.entries()).map(([rack, data]) => ({
          rack,
          kotakNumbers: Array.from(data.kotakNumbers.entries())
            .map(([kotak, kotakData]) => ({
              kotak,
              fileCount: kotakData.fileCount
            }))
            .sort((a, b) => a.kotak.localeCompare(b.kotak, undefined, { numeric: true }))
        }));

        console.log('Final racksData:', racksData);
        setRacks(racksData);
      } else {
        console.log('No racks data or invalid format:', racksResult);
      }
      
      // Set available kotak numbers from API response
      if (availableBoxesResult.success && Array.isArray(availableBoxesResult.data)) {
        setAvailableKotakNumbers(availableBoxesResult.data);
      } else {
        console.log('No available boxes data or invalid format:', availableBoxesResult);
        setAvailableKotakNumbers([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRackClick = (rackName: string) => {
    setExpandedRack(expandedRack === rackName ? null : rackName);
    setSelectedKotak(null);
    setKotakFiles([]);
  };

  const handleEditClick = (file: FileCase) => {
    setEditingFile(file);
    setUpdateForm({ location: file.location });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    try {
      const response = await fetch('/api/files/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refFile: editingFile.reffile,
          activity: 'File updated via racks page',
          location: updateForm.location,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the local state
        const updatedFiles = files.map(file => 
          file.reffile === editingFile.reffile 
            ? { ...file, location: updateForm.location }
            : file
        );
        setFiles(updatedFiles);
        setEditingFile(null);
        
        // Also update kotakFiles if it contains the edited file
        const updatedKotakFiles = kotakFiles.map(file => 
          file.reffile === editingFile.reffile 
            ? { ...file, location: updateForm.location }
            : file
        );
        setKotakFiles(updatedKotakFiles);
      } else {
        alert('Update failed: ' + result.data);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred while updating the file');
    }
  };

  const handleKotakClick = (kotakNumber: string) => {
    setSelectedKotak(kotakNumber);
    
    console.log('=== KOTAK CLICK DEBUG ===');
    console.log('Looking for kotak:', kotakNumber);
    console.log('Total files available:', files.length);
    
    // Show ALL files with this kotak number (regardless of their category)
    const allKotakFiles = files.filter(file => {
      const fileKotak = (file.kotak || '').toString().trim();
      const targetKotak = (kotakNumber || '').toString().trim();
      
      const kotakMatch = fileKotak === targetKotak;
      
      console.log(`File ${file.reffile}: kotak="${fileKotak}" vs "${targetKotak}" (match: ${kotakMatch}), file category="${file.category}"`);
      
      return kotakMatch;
    });
    
    console.log(`All files in kotak ${kotakNumber}:`, allKotakFiles);
    console.log('Files will show their actual categories from file data');
    console.log('=== END DEBUG ===');
    
    setKotakFiles(allKotakFiles);
  };

  const handleAddRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRackForm.rack.trim()) return;

    // Check for duplicate rack names
    const existingRack = racks.find(rack => rack.rack.toLowerCase() === newRackForm.rack.trim().toLowerCase());
    if (existingRack) {
      alert(`Rack "${newRackForm.rack.trim()}" already exists. Please choose a different name.`);
      return;
    }

    setIsSubmittingRack(true);
    try {
      const response = await fetch('/api/racks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rack: newRackForm.rack.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowAddRackModal(false);
        setNewRackForm({ rack: '' });
        checkAuthAndLoadData(); // Reload data
        alert('Rack added successfully!');
      } else {
        alert('Failed to add rack: ' + result.message);
      }
    } catch (error) {
      console.error('Add rack error:', error);
      alert('An error occurred while adding the rack');
    } finally {
      setIsSubmittingRack(false);
    }
  };

  const handleAddKotak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKotakForm.kotak.trim()) return;

    setIsSubmittingKotak(true);
    try {
      const response = await fetch('/api/boxes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kotak: newKotakForm.kotak.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowAddKotakModal(false);
        setNewKotakForm({ kotak: '' });
        checkAuthAndLoadData(); // Reload data
        alert('Box created successfully!');
      } else {
        alert('Failed to create box: ' + result.message);
      }
    } catch (error) {
      console.error('Create box error:', error);
      alert('An error occurred while creating the box');
    } finally {
      setIsSubmittingKotak(false);
    }
  };

  const handleAddBoxToRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBoxToRackForm.rack || !addBoxToRackForm.kotak.trim()) return;

    setIsSubmittingBoxToRack(true);
    try {
      const response = await fetch('/api/racks/add-kotak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rack: addBoxToRackForm.rack,
          kotak: addBoxToRackForm.kotak.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowAddBoxToRackModal(false);
        setAddBoxToRackForm({ rack: '', kotak: '' });
        checkAuthAndLoadData(); // Reload data
        alert('Box added to rack successfully!');
      } else {
        alert('Failed to add box to rack: ' + result.message);
      }
    } catch (error) {
      console.error('Add box to rack error:', error);
      alert('An error occurred while adding the box to rack');
    } finally {
      setIsSubmittingBoxToRack(false);
    }
  };

  const handleDeleteRack = async (rackName: string) => {
    if (!confirm(`Are you sure you want to delete rack "${rackName}"? This will also delete all associated kotak.`)) return;

    setDeletingRack(rackName);
    try {
      const response = await fetch('/api/racks/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rack: rackName
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        checkAuthAndLoadData(); // Reload data
        alert('Rack deleted successfully!');
      } else {
        alert('Failed to delete rack: ' + result.message);
      }
    } catch (error) {
      console.error('Delete rack error:', error);
      alert('An error occurred while deleting the rack');
    } finally {
      setDeletingRack(null);
    }
  };

  const handleDeleteKotak = async (rackName: string, kotakNumber: string) => {
    if (!confirm(`Are you sure you want to delete kotak "${kotakNumber}" from rack "${rackName}"?`)) return;

    setDeletingKotak(`${rackName}-${kotakNumber}`);
    try {
      const response = await fetch('/api/racks/delete-kotak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rack: rackName,
          kotak: kotakNumber
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        checkAuthAndLoadData(); // Reload data
        alert('Kotak deleted successfully!');
      } else {
        alert('Failed to delete kotak: ' + result.message);
      }
    } catch (error) {
      console.error('Delete kotak error:', error);
      alert('An error occurred while deleting the kotak');
    } finally {
      setDeletingKotak(null);
    }
  };

  const handleDeleteBoxOnly = async (kotakNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete box "${kotakNumber}"? This will remove it from the entire system and cannot be undone.`)) return;

    setDeletingBoxOnly(kotakNumber);
    try {
      const response = await fetch('/api/boxes/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kotak: kotakNumber
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        checkAuthAndLoadData(); // Reload data
        alert('Box deleted permanently!');
      } else {
        alert('Failed to delete box: ' + result.message);
      }
    } catch (error) {
      console.error('Delete box error:', error);
      alert('An error occurred while deleting the box');
    } finally {
      setDeletingBoxOnly(null);
    }
  };

  const filteredRacks = racks.filter(rack => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const rackName = (rack.rack || '').toString().toLowerCase();
    const kotakMatches = rack.kotakNumbers.some(kotakData => 
      (kotakData.kotak || '').toString().toLowerCase().includes(searchLower)
    );
    
    return rackName.includes(searchLower) || kotakMatches;
  });

  // Get unused boxes (boxes that are not in any rack and have no files)
  const getUnusedBoxes = () => {
    const usedBoxes = new Set();
    
    // Collect all kotak that are in racks
    racks.forEach(rack => {
      rack.kotakNumbers.forEach(kotakData => {
        usedBoxes.add(kotakData.kotak);
      });
    });
    
    // Collect all kotak that have files
    files.forEach(file => {
      if (file.kotak) {
        const kotakStr = file.kotak.toString().trim();
        if (kotakStr) {
          usedBoxes.add(kotakStr);
        }
      }
    });
    
    // Return available boxes that are NOT used
    return availableKotakNumbers.filter(kotak => !usedBoxes.has(kotak));
  };

  const unusedBoxes = getUnusedBoxes();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Single clean loading spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          
          {/* Loading text with dots animation */}
          <div className="text-lg text-gray-700 font-medium">
            Loading racks
            <span className="inline-flex ml-1">
              <span className="animate-bounce delay-0">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-1 mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">Please wait while we load your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/logo AH 2023-03.png" 
                alt="AH Company Logo" 
                className="h-8 w-8 mr-3 object-contain"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rack & Box Management</h1>
                <p className="text-xs text-gray-500">Developed by <span className="font-semibold text-orange-600">RUBIX TECHNOLOGY</span></p>
              </div>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4 ml-auto">
              <a
                href="/admin/dashboard"
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Dashboard
              </a>
              <a
                href="/admin/manage"
                className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Manage Files
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex items-center">
              <div className="sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="pt-4 space-y-2">
                <a
                  href="/admin/dashboard"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <HomeIcon className="mr-3 h-5 w-5 text-blue-500" />
                    Dashboard
                  </div>
                </a>
                <a
                  href="/admin/manage"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <PencilIcon className="mr-3 h-5 w-5 text-green-500" />
                    Manage Files
                  </div>
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500" />
                    Logout
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Side - Racks List */}
          <div className="lg:col-span-2 xl:col-span-2 bg-white rounded-lg shadow-md">
            <div className="p-6">
<div className="flex justify-between items-start sm:items-center mb-6">
  {/* Left side: Title and rack count */}
  <div>
    <h2 className="text-xl font-semibold text-gray-900">Racks & Box</h2>
    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
      <CubeIcon className="h-5 w-5" />
      <span>{racks.length} Racks</span>
    </div>
  </div>

  {/* Right side: Quick Actions button */}
  <div className="relative">
    <button
      onClick={() => setActionMenuOpen(!actionMenuOpen)}
      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      Quick Actions
      <ChevronDownIcon
        className={`h-4 w-4 ml-2 transition-transform duration-200 ${actionMenuOpen ? 'rotate-180' : ''}`}
      />
    </button>

    {actionMenuOpen && (
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
        <div className="py-2">
          {/* Add New Rack */}
          <button
            onClick={() => {
              setShowAddRackModal(true);
              setActionMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200 flex items-center group"
          >
            <div className="w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
              <PlusIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium">Add New Rack</div>
              <div className="text-xs text-gray-500">Create a new storage rack</div>
            </div>
          </button>

          {/* Add Box to Rack */}
          <button
            onClick={() => {
              setShowAddBoxToRackModal(true);
              setActionMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center group"
          >
            <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
              <PlusIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Add Box to Rack</div>
              <div className="text-xs text-gray-500">Assign box to existing rack</div>
            </div>
          </button>

          {/* Create New Box */}
          <button
            onClick={() => {
              setShowAddKotakModal(true);
              setActionMenuOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200 flex items-center group"
          >
            <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-3 transition-colors duration-200">
              <PlusIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="font-medium">Create New Box</div>
              <div className="text-xs text-gray-500">Add new storage box</div>
            </div>
          </button>
        </div>
      </div>
    )}

    {/* Click outside to close dropdown */}
    {actionMenuOpen && (
      <div
        className="fixed inset-0 z-40"
        onClick={() => setActionMenuOpen(false)}
      ></div>
    )}
  </div>
</div>


              {/* Legend */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Legend:</h3>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white border border-gray-200 rounded mr-2"></div>
                    <span className="text-gray-600">Box</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded mr-2"></div>
                    <span className="text-blue-700">Selected Box</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 mr-2">📁</span>
                    <span className="text-gray-600">File Category</span>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-4 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Search racks..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Racks List */}
              <div className="space-y-2">
                {filteredRacks.map((rack) => (
                  <div key={rack.rack} className="border border-gray-200 rounded-lg relative">
                    <div
                      onClick={() => handleRackClick(rack.rack)}
                      className="w-full px-4 py-3 pr-12 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {expandedRack === rack.rack ? (
                              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{rack.rack}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rack.kotakNumbers.length} Kotak
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRack(rack.rack);
                      }}
                      disabled={deletingRack === rack.rack}
                      className="absolute top-2 right-2 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed opacity-100 sm:opacity-70 sm:hover:opacity-100"
                      title="Delete Rack"
                    >
                      {deletingRack === rack.rack ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedRack === rack.rack && (
                      <div className="px-4 pb-3">
                        <div className="pl-4 sm:pl-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-2">
                          {rack.kotakNumbers.map((kotakData) => (
                            <div key={`${rack.rack}-${kotakData.kotak}`} className="relative group">
                              <div
                                onClick={() => handleKotakClick(kotakData.kotak)}
                                className={`w-full p-4 sm:p-3 text-sm rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                                  selectedKotak === kotakData.kotak
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center mb-1">
                                    <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                                    <span className="font-medium">{kotakData.kotak}</span>
                                  </div>
                                  <div className="text-xs text-center space-y-1">
                                    <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                      kotakData.fileCount > 0 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {kotakData.fileCount} files
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Remove from rack button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteKotak(rack.rack, kotakData.kotak);
                                }}
                                disabled={deletingKotak === `${rack.rack}-${kotakData.kotak}`}
                                className="absolute top-1 right-7 p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove from Rack"
                              >
                                {deletingKotak === `${rack.rack}-${kotakData.kotak}` ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-600 border-t-transparent"></div>
                                ) : (
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                              
                              {/* Delete permanently button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBoxOnly(kotakData.kotak);
                                }}
                                disabled={deletingBoxOnly === kotakData.kotak}
                                className="absolute top-1 right-1 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Box Permanently"
                              >
                                {deletingBoxOnly === kotakData.kotak ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                                ) : (
                                  <TrashIcon className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredRacks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No racks found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Box Details */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Box Details</h3>
              
              {!selectedKotak ? (
                <div className="text-center py-8 text-gray-500">
                  <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Select a Box to view files</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Box: {selectedKotak}</h4>
                    <p className="text-sm text-blue-700">{kotakFiles.length} files</p>
                  </div>

                  {/* Information about file categories */}
                  <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">ℹ️ Note:</span> Files display their actual category from the file data 📁
                    </p>
                  </div>
                  
                  {(() => {
                    return (
                      <div className="space-y-2">
                        {kotakFiles.map((file, index) => (
                            <div 
                              key={`${selectedKotak}-${file.reffile}-${index}`} 
                              className="p-4 sm:p-3 border border-gray-100 rounded hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                              onClick={() => setViewingFile(file)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-blue-600">{file.reffile}</p>
                                  <p className="text-xs text-gray-600 mt-1">{file.clientname}</p>
                                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                    <span>Year: {file.year}</span>
                                    <span>Type: {file.type}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      file.status?.toLowerCase() === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : file.status?.toLowerCase() === 'inactive'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {file.status}
                                    </span>
                                  </div>
                                  {file.category && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        📁 {file.category}
                                      </span>
                                    </div>
                                  )}
                                  {file.barcodeno && (
                                    <p className="text-xs text-gray-400 mt-1">Barcode: {file.barcodeno}</p>
                                  )}
                                  {file.location && (
                                    <p className="text-xs text-gray-400">Location: {file.location}</p>
                                  )}
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 ml-2">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                          ))
                  }
                        {kotakFiles.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="font-medium text-gray-900 mb-2">No files found</p>
                            <p className="text-sm">This kotak appears to be empty.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unused Boxes Section */}
        {unusedBoxes.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md">
            <div className="border border-gray-200 rounded-lg relative">
              <div
                onClick={() => setShowUnusedBoxes(!showUnusedBoxes)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {showUnusedBoxes ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Unused Boxes</p>
                      <p className="text-xs text-gray-500">Boxes not assigned to any rack and have no files</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {unusedBoxes.length} Unused
                    </span>
                  </div>
                </div>
              </div>
              
              {showUnusedBoxes && (
                <div className="px-4 pb-3">
                  <div className="pl-4 sm:pl-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-2">
                    {unusedBoxes.map((kotakName) => (
                      <div key={kotakName} className="relative group">
                        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 transition-colors duration-200">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center mb-2">
                              <ArchiveBoxIcon className="h-4 w-4 mr-1 text-orange-600" />
                              <span className="font-medium text-orange-900">{kotakName}</span>
                            </div>
                            <div className="text-xs text-center space-y-1">
                              <div className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Unused
                              </div>
                              <div className="text-orange-600 text-xs">
                                No rack • No files
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Delete unused box button */}
                        <button
                          onClick={() => handleDeleteBoxOnly(kotakName)}
                          disabled={deletingBoxOnly === kotakName}
                          className="absolute top-1 right-1 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Unused Box"
                        >
                          {deletingBoxOnly === kotakName ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <TrashIcon className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update File: {editingFile.reffile}
              </h3>
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status (Computed from Year)
                  </label>
                  <input
                    type="text"
                    value={editingFile?.status || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Status is automatically calculated: Active (0-7 years), Inactive (7-10 years), Archive (10+ years)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={updateForm.location}
                    onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="Warehouse">Warehouse</option>
                    <option value="HQ">HQ</option>
                    <option value="BANK">BANK</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="COURT">COURT</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingFile(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* File Detail Popup */}
      {viewingFile && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-xs sm:max-w-lg lg:max-w-3xl bg-white rounded-xl shadow-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="h-6 w-6 mr-2" />
                    <h3 className="text-xl font-bold">File Case Details</h3>
                  </div>
                  <p className="text-blue-100 text-sm">Reference: {viewingFile.reffile}</p>
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      viewingFile.status?.toLowerCase() === 'active' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {viewingFile.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingFile(null)}
                  className="text-blue-100 hover:text-white focus:outline-none transition-colors p-2 rounded-full hover:bg-blue-800"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Document Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-500 p-1.5 rounded">
                        <DocumentTextIcon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-blue-900 ml-2">Document Information</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <IdentificationIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-700">Reference File</p>
                          <p className="text-sm text-blue-900 break-all font-mono bg-white px-2 py-1 rounded mt-1">{viewingFile.reffile}</p>
                        </div>
                      </div>
                      {viewingFile.barcodeno && (
                        <div className="flex items-start">
                          <svg className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5m0 0v5m0 0h5m0 0v5" />
                          </svg>
                          <div>
                            <p className="text-xs font-medium text-blue-700">Barcode</p>
                            <p className="text-sm text-blue-900 font-mono bg-white px-2 py-1 rounded mt-1">{viewingFile.barcodeno}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-blue-700">Year</p>
                          <p className="text-sm text-blue-900 font-semibold">{viewingFile.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-emerald-500 p-1.5 rounded">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-emerald-900 ml-2">Client Information</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-emerald-600 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-emerald-700">Client Name</p>
                          <p className="text-sm text-emerald-900 font-semibold">{viewingFile.clientname}</p>
                        </div>
                      </div>
                      {viewingFile.phoneClient && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-emerald-600 mr-2" />
                          <div>
                            <p className="text-xs font-medium text-emerald-700">Phone Number</p>
                            <p className="text-sm text-emerald-900">{viewingFile.phoneClient}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Classification */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-purple-500 p-1.5 rounded">
                        <TagIcon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-purple-900 ml-2">Classification</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 text-purple-600 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-purple-700">Category</p>
                          <p className="text-sm text-purple-900 font-semibold">{viewingFile.category}</p>
                        </div>
                      </div>
                      {viewingFile.type && (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <div>
                            <p className="text-xs font-medium text-purple-700">Type</p>
                            <p className="text-sm text-purple-900">{viewingFile.type}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Storage Information */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center mb-3">
                      <div className="bg-orange-500 p-1.5 rounded">
                        <MapPinIcon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-orange-900 ml-2">Storage Location</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-orange-600 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-orange-700">Location</p>
                          <p className="text-sm text-orange-900 font-semibold">{viewingFile.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CubeIcon className="h-4 w-4 text-orange-600 mr-2" />
                        <div>
                          <p className="text-xs font-medium text-orange-700">Kotak</p>
                          <p className="text-sm text-orange-900">{viewingFile.kotak}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {(viewingFile.safekeeping || viewingFile.agentdetails || viewingFile.pic || viewingFile.bank) && (
                <div className="mt-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center mb-3">
                    <div className="bg-slate-600 p-1.5 rounded">
                      <ShieldCheckIcon className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 ml-2">Additional Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewingFile.safekeeping && (
                      <div className="flex items-start">
                        <ShieldCheckIcon className="h-4 w-4 text-slate-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">Safekeeping</p>
                          <p className="text-sm text-slate-900">{viewingFile.safekeeping}</p>
                        </div>
                      </div>
                    )}
                    {viewingFile.agentdetails && (
                      <div className="flex items-start">
                        <UserGroupIcon className="h-4 w-4 text-slate-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">Agent Details</p>
                          <p className="text-sm text-slate-900">{viewingFile.agentdetails}</p>
                        </div>
                      </div>
                    )}
                    {viewingFile.pic && (
                      <div className="flex items-start">
                        <UserIcon className="h-4 w-4 text-slate-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">PIC</p>
                          <p className="text-sm text-slate-900">{viewingFile.pic}</p>
                        </div>
                      </div>
                    )}
                    {viewingFile.bank && (
                      <div className="flex items-start">
                        <BanknotesIcon className="h-4 w-4 text-slate-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-700">Bank</p>
                          <p className="text-sm text-slate-900">{viewingFile.bank}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 rounded-b-xl border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString('en-GB')}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setViewingFile(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditClick(viewingFile);
                      setViewingFile(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <PencilIcon className="h-4 w-4 mr-2 inline" />
                    Edit File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {showAddRackModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-xs sm:max-w-md shadow-lg rounded-md bg-white hover:shadow-xl transition-shadow duration-300">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Rack</h3>
                <button
                  onClick={() => setShowAddRackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddRack} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rack Number/Name</label>
                  <input
                    type="text"
                    required
                    value={newRackForm.rack}
                    onChange={(e) => setNewRackForm({...newRackForm, rack: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-900"
                    placeholder="e.g., 3, 9, 14"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available racks: 1,2,4,5,6,7,8,10,11,12,13. Missing: 3,9
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddRackModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRack}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmittingRack ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Kotak Modal */}
      {showAddKotakModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-xs sm:max-w-md shadow-lg rounded-md bg-white hover:shadow-xl transition-shadow duration-300">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Box</h3>
                <button
                  onClick={() => setShowAddKotakModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddKotak} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Box Name</label>
                  <input
                    type="text"
                    required
                    value={newKotakForm.kotak}
                    onChange={(e) => setNewKotakForm({...newKotakForm, kotak: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter box name (e.g., IDK001, 200A, etc.)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will create a new box that you can later assign to a rack.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddKotakModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingKotak}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmittingKotak ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Box to Rack Modal */}
      {showAddBoxToRackModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-xs sm:max-w-md shadow-lg rounded-md bg-white hover:shadow-xl transition-shadow duration-300">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Box to Rack</h3>
                <button
                  onClick={() => setShowAddBoxToRackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddBoxToRack} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Rack</label>
                  <select
                    required
                    value={addBoxToRackForm.rack}
                    onChange={(e) => setAddBoxToRackForm({...addBoxToRackForm, rack: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Choose a rack</option>
                    {racks.map((rack) => (
                      <option key={rack.rack} value={rack.rack}>
                        Rack {rack.rack} ({rack.kotakNumbers.length} kotak)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Recent Box</label>
                  {availableKotakNumbers.length > 0 ? (
                    <select
                      required
                      value={addBoxToRackForm.kotak}
                      onChange={(e) => setAddBoxToRackForm({...addBoxToRackForm, kotak: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">Choose a box</option>
                      {availableKotakNumbers.map((kotakNum) => {
                        const fileCount = files.filter(f => String(f.kotak || '').trim() === kotakNum).length;
                        return (
                          <option key={kotakNum} value={kotakNum}>
                            {kotakNum} ({fileCount} files)
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                      No available box found. All box are already assigned to racks.
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ <span className="font-medium text-green-700"></span>{availableKotakNumbers.length} kotak ready to add to racks
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddBoxToRackModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableKotakNumbers.length === 0 || isSubmittingBoxToRack}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmittingBoxToRack ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}