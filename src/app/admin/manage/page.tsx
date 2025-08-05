'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  CubeIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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

export default function ManagePage() {
  const [files, setFiles] = useState<FileCase[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileCase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(20);
  const [editingFile, setEditingFile] = useState<FileCase | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [refSearchTerm, setRefSearchTerm] = useState('');
  const [searchedFile, setSearchedFile] = useState<FileCase | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<FileCase[]>([]);
  const [categories, setCategories] = useState<{id: number, category: string}[]>([]);
  const [types, setTypes] = useState<{id: number, type: string}[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newFile, setNewFile] = useState<Partial<FileCase>>({
    year: '',
    category: '',
    type: '',
    kotak: '',
    reffile: '',
    clientname: '',
    phoneClient: '',
    barcodeno: '',
    safekeeping: 'TRUE',
    agentdetails: '',
    pic: '',
    bank: '',
    location: 'Warehouse'
  });
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isUpdatingFile, setIsUpdatingFile] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [isUpdatingSearchedFile, setIsUpdatingSearchedFile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadFiles();
    loadCategoriesAndTypes();
  }, []);

  const loadCategoriesAndTypes = async () => {
    try {
      const [categoriesResponse, typesResponse] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/types')
      ]);

      if (categoriesResponse.ok) {
        const categoriesResult = await categoriesResponse.json();
        if (categoriesResult.success) {
          setCategories(categoriesResult.data);
        }
      }

      if (typesResponse.ok) {
        const typesResult = await typesResponse.json();
        if (typesResult.success) {
          setTypes(typesResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading categories and types:', error);
    }
  };

  const saveCustomCategory = async (category: string) => {
    if (!category.trim()) return;
    
    // Check if category already exists (case insensitive)
    const existingCategory = categories.find(cat => 
      cat.category.toLowerCase() === category.trim().toLowerCase()
    );
    
    if (!existingCategory) {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ category: category.trim() })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Reload categories to get the updated list
            await loadCategoriesAndTypes();
          }
        }
      } catch (error) {
        console.error('Error saving category:', error);
      }
    }
  };

  const saveCustomType = async (type: string) => {
    if (!type.trim()) return;
    
    // Check if type already exists (case insensitive)
    const existingType = types.find(t => 
      t.type.toLowerCase() === type.trim().toLowerCase()
    );
    
    if (!existingType) {
      try {
        const response = await fetch('/api/types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: type.trim() })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Reload types to get the updated list
            await loadCategoriesAndTypes();
          }
        }
      } catch (error) {
        console.error('Error saving type:', error);
      }
    }
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = files.filter(file => {
        const reffile = (file.reffile || '').toString().toLowerCase();
        const clientname = (file.clientname || '').toString().toLowerCase();
        const category = (file.category || '').toString().toLowerCase();
        const kotak = (file.kotak || '').toString().toLowerCase();
        
        return reffile.includes(searchLower) ||
               clientname.includes(searchLower) ||
               category.includes(searchLower) ||
               kotak.includes(searchLower);
      });
      setFilteredFiles(filtered);
      setCurrentPage(1);
    } else {
      setFilteredFiles(files);
      setCurrentPage(1);
    }
  }, [searchTerm, files]);

  const checkAuthAndLoadFiles = async () => {
    try {
      const authResponse = await fetch('/api/auth/verify');
      if (!authResponse.ok) {
        router.push('/admin');
        return;
      }

      const filesResponse = await fetch('/api/files/all');
      const result = await filesResponse.json();
      
      if (result.success && Array.isArray(result.data)) {
        const cleanedData = result.data.map((file: any) => {
          const mappedFile = {
            ...file,
            id: file.id || '',
            reffile: file.reffile || '',
            clientname: file.clientname || '',
            category: file.category || '',
            kotak: file.kotak || '',
            year: file.year || '',
            type: file.type || '',
            location: file.location || ''
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
          }
          
          return mappedFile;
        });
        
        // Sort files by ID descending to show recent files first
        const sortedData = cleanedData.sort((a: FileCase, b: FileCase) => {
          const idA = a.id ? parseInt(a.id.replace('ID', '')) : 0;
          const idB = b.id ? parseInt(b.id.replace('ID', '')) : 0;
          return idB - idA; // Descending order (newest first)
        });
        
        setFiles(sortedData);
        setFilteredFiles(sortedData);
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

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingFile(true);
    
    try {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFile),
      });

      const result = await response.json();
      console.log('Create file response:', result);
      
      if (result.success) {
        // Add the new file to the list
        const createdFile = { ...newFile, id: Date.now().toString() } as FileCase;
        setFiles([createdFile, ...files]);
        setShowNewForm(false);
        setNewFile({
          year: '',
          category: '',
          type: '',
          kotak: '',
          reffile: '',
          clientname: '',
          phoneClient: '',
          barcodeno: '',
          safekeeping: 'TRUE',
          agentdetails: '',
          pic: '',
          bank: '',
          location: 'Warehouse'
        });
        alert('File created successfully!');
      } else {
        alert('Create failed: ' + result.message);
      }
    } catch (error) {
      console.error('Create error:', error);
      alert('An error occurred while creating the file');
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleUpdateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    console.log('Updating file:', editingFile);
    setIsUpdatingFile(true);

    try {
      const response = await fetch('/api/files/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingFile,
          activity: 'File updated via manage page',
        }),
      });

      const result = await response.json();
      console.log('Update result:', result);
      
      if (result.success) {
        const updatedFiles = files.map(file => 
          file.id === editingFile.id 
            ? { ...editingFile }
            : file
        );
        setFiles(updatedFiles);
        setFilteredFiles(updatedFiles);
        setEditingFile(null);
        alert('File updated successfully!');
      } else {
        console.error('Update failed with result:', result);
        alert('Update failed: ' + (result.message || result.data || 'Unknown error'));
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred while updating the file');
    } finally {
      setIsUpdatingFile(false);
    }
  };

  const handleDeleteFile = async (reffile: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setIsDeletingFile(true);
    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refFile: reffile }),
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedFiles = files.filter(file => file.reffile !== reffile);
        setFiles(updatedFiles);
        setSearchedFile(null);
        setRefSearchTerm('');
        alert('File deleted successfully!');
      } else {
        alert('Delete failed: ' + result.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the file');
    } finally {
      setIsDeletingFile(false);
    }
  };

  const handleSearchByRefFile = (searchValue: string) => {
    if (!searchValue.trim()) {
      setSearchedFile(null);
      setShowDropdown(false);
      setFilteredSuggestions([]);
      return;
    }

    // Filter files that match the search term
    const matchingFiles = files.filter(file => 
      file.reffile.toLowerCase().includes(searchValue.toLowerCase().trim())
    );

    setFilteredSuggestions(matchingFiles.slice(0, 10)); // Limit to 10 suggestions
    setShowDropdown(matchingFiles.length > 0);

    // If exact match found, select it automatically
    const exactMatch = files.find(file => 
      file.reffile.toLowerCase() === searchValue.toLowerCase().trim()
    );

    if (exactMatch) {
      setSearchedFile(exactMatch);
    } else {
      setSearchedFile(null);
    }
  };

  const handleSelectSuggestion = (file: FileCase) => {
    setRefSearchTerm(file.reffile);
    setSearchedFile(file);
    setShowDropdown(false);
    setFilteredSuggestions([]);
  };

  const handleDirectUpdate = async () => {
    if (!searchedFile) return;

    setIsUpdatingSearchedFile(true);
    try {
      const response = await fetch('/api/files/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...searchedFile,
          activity: 'File updated via search form',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the files list with the updated file
        const updatedFiles = files.map(file => 
          file.id === searchedFile.id 
            ? { ...searchedFile }
            : file
        );
        setFiles(updatedFiles);
        setFilteredFiles(updatedFiles);
        alert('File updated successfully!');
      } else {
        alert('Update failed: ' + (result.message || result.data || 'Unknown error'));
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred while updating the file');
    } finally {
      setIsUpdatingSearchedFile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700 font-medium">Loading management panel...</div>
        </div>
      </div>
    );
  }

  // Pagination calculations
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FileCase Management</h1>
                <p className="text-xs text-gray-500">Developed by <span className="font-semibold text-orange-600">RUBIX TECHNOLOGY</span></p>
              </div>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4 ml-auto">
              <a
                href="/admin/dashboard"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Dashboard
              </a>
              <a
                href="/admin/racks"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
              >
                <CubeIcon className="mr-2 h-4 w-4" />
                Racks & Box
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
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
                  href="/admin/racks"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <CubeIcon className="mr-3 h-5 w-5 text-green-500" />
                    Racks & Box
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

      <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Side - New File Form */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create New File</h2>
                <button
                  onClick={() => setShowNewForm(!showNewForm)}
                  className="inline-flex items-center px-4 py-3 bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200 text-white font-medium rounded-lg"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {showNewForm ? 'Cancel' : 'New File'}
                </button>
              </div>

              {showNewForm && (
                <form onSubmit={handleCreateFile} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference File*</label>
                      <input
                        type="text"
                        required
                        value={newFile.reffile || ''}
                        onChange={(e) => setNewFile({...newFile, reffile: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Name*</label>
                      <input
                        type="text"
                        required
                        value={newFile.clientname || ''}
                        onChange={(e) => setNewFile({...newFile, clientname: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                      <select
                        value={categories.map(cat => cat.category).includes(newFile.category || '') ? newFile.category : 'CUSTOM'}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM') {
                            // Don't change category, let user type in input field
                            return;
                          }
                          setNewFile({...newFile, category: e.target.value, type: e.target.value !== 'LITIGATION' ? '' : newFile.type});
                        }}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="">Select Category...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.category}>{cat.category}</option>
                        ))}
                        <option value="CUSTOM">─── Add New Category ───</option>
                      </select>
                      <input
                        type="text"
                        value={!categories.map(cat => cat.category).includes(newFile.category || '') ? (newFile.category || '') : ''}
                        onChange={(e) => {
                          setNewFile({...newFile, category: e.target.value, type: ''});
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            saveCustomCategory(e.target.value.trim());
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 mt-1"
                        placeholder="Type custom category..."
                      />
                    </div>
                    {newFile.category === 'LITIGATION' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
                        <select
                          value={types.map(t => t.type).includes(newFile.type || '') ? newFile.type : 'CUSTOM'}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') return;
                            setNewFile({...newFile, type: e.target.value});
                          }}
                          className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="">Select Type...</option>
                          {types.map(t => (
                            <option key={t.id} value={t.type}>{t.type}</option>
                          ))}
                          <option value="CUSTOM">─── Add New Type ───</option>
                        </select>
                        <input
                          type="text"
                          value={!types.map(t => t.type).includes(newFile.type || '') ? (newFile.type || '') : ''}
                          onChange={(e) => setNewFile({...newFile, type: e.target.value})}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              saveCustomType(e.target.value.trim());
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 mt-1"
                          placeholder="Type custom litigation type..."
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kotak*</label>
                      <input
                        type="text"
                        required
                        value={newFile.kotak || ''}
                        onChange={(e) => setNewFile({...newFile, kotak: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="text"
                        value={newFile.year || ''}
                        onChange={(e) => setNewFile({...newFile, year: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Client</label>
                      <input
                        type="text"
                        value={newFile.phoneClient || ''}
                        onChange={(e) => setNewFile({...newFile, phoneClient: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barcode No</label>
                      <input
                        type="text"
                        value={newFile.barcodeno || ''}
                        onChange={(e) => setNewFile({...newFile, barcodeno: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <select
                        value={newFile.location || 'Warehouse'}
                        onChange={(e) => setNewFile({ ...newFile, location: e.target.value })}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                      <input
                        type="text"
                        value={newFile.agentdetails || ''}
                        onChange={(e) => setNewFile({...newFile, agentdetails: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PIC</label>
                      <input
                        type="text"
                        value={newFile.pic || ''}
                        onChange={(e) => setNewFile({...newFile, pic: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                      <input
                        type="text"
                        value={newFile.bank || ''}
                        onChange={(e) => setNewFile({...newFile, bank: e.target.value})}
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingFile}
                      className="inline-flex items-center px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                      {isCreatingFile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create File'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Side - Search by Ref File */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Search by Reference File</h2>
                <div className="text-sm text-gray-500">
                  {filteredFiles.length} total files
                </div>
              </div>


              {/* Search Input - Separate from form */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="relative">
                  <input
                    type="text"
                    value={refSearchTerm}
                    onChange={(e) => {
                      setRefSearchTerm(e.target.value);
                      handleSearchByRefFile(e.target.value);
                    }}
                    onFocus={() => {
                      if (filteredSuggestions.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow click on suggestions
                      setTimeout(() => setShowDropdown(false), 200);
                    }}
                    className="w-full pl-10 pr-3 py-4 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm text-gray-900"
                    placeholder="Search reference files..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* Clear search button */}
                  {refSearchTerm && (
                    <button
                      onClick={() => {
                        setRefSearchTerm('');
                        setSearchedFile(null);
                        setShowDropdown(false);
                        setFilteredSuggestions([]);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                  
                  {/* Dropdown suggestions */}
                  {showDropdown && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuggestions.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectSuggestion(file)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-600 text-sm">{file.reffile}</div>
                              <div className="text-xs text-gray-600">{file.clientname}</div>
                              <div className="text-xs text-gray-500 flex items-center space-x-2 mt-1">
                                <span>📁 {file.category}</span>
                                <span>📦 {file.kotak}</span>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                              file.status?.toLowerCase() === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : file.status?.toLowerCase() === 'inactive'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {file.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* File Details Form - Always Visible */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">📄 File Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference File</label>
                    <input
                      type="text"
                      value={searchedFile?.reffile || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, reffile: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder="Search file above to edit..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={searchedFile?.clientname || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, clientname: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={categories.map(cat => cat.category).includes(searchedFile?.category || '') ? searchedFile?.category : 'CUSTOM'}
                      onChange={(e) => {
                        if (!searchedFile) return;
                        if (e.target.value === 'CUSTOM') {
                          // Don't change category, let user type in input field
                          return;
                        }
                        setSearchedFile({ ...searchedFile, category: e.target.value, type: e.target.value !== 'LITIGATION' ? '' : searchedFile.type });
                      }}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.category}>{cat.category}</option>
                      ))}
                      <option value="CUSTOM">─── Add New Category ───</option>
                    </select>
                    <input
                      type="text"
                      value={!categories.map(cat => cat.category).includes(searchedFile?.category || '') ? (searchedFile?.category || '') : ''}
                      onChange={(e) => {
                        if (searchedFile) {
                          setSearchedFile({ ...searchedFile, category: e.target.value, type: '' });
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          saveCustomCategory(e.target.value.trim());
                        }
                      }}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 mt-1 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder="Type custom category..."
                    />
                  </div>
                  {searchedFile?.category === 'LITIGATION' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
                      <select
                        value={types.map(t => t.type).includes(searchedFile?.type || '') ? searchedFile?.type : 'CUSTOM'}
                        onChange={(e) => {
                          if (!searchedFile || e.target.value === 'CUSTOM') return;
                          setSearchedFile({ ...searchedFile, type: e.target.value });
                        }}
                        disabled={!searchedFile}
                        className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                          searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                        }`}
                      >
                        <option value="">Select Type...</option>
                        {types.map(t => (
                          <option key={t.id} value={t.type}>{t.type}</option>
                        ))}
                        <option value="CUSTOM">─── Add New Type ───</option>
                      </select>
                      <input
                        type="text"
                        value={!types.map(t => t.type).includes(searchedFile?.type || '') ? (searchedFile?.type || '') : ''}
                        onChange={(e) => {
                          if (searchedFile) {
                            setSearchedFile({ ...searchedFile, type: e.target.value });
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            saveCustomType(e.target.value.trim());
                          }
                        }}
                        disabled={!searchedFile}
                        className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 mt-1 ${
                          searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                        }`}
                        placeholder="Type custom litigation type..."
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kotak</label>
                    <input
                      type="text"
                      value={searchedFile?.kotak || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, kotak: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={searchedFile?.year || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, year: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Client</label>
                    <input
                      type="text"
                      value={searchedFile?.phoneClient || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, phoneClient: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode No</label>
                    <input
                      type="text"
                      value={searchedFile?.barcodeno || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, barcodeno: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      value={searchedFile?.location || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, location: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                    >
                      <option value="">Select location...</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="HQ">HQ</option>
                      <option value="BANK">BANK</option>
                      <option value="CLIENT">CLIENT</option>
                      <option value="COURT">COURT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                    <input
                      type="text"
                      value={searchedFile?.agentdetails || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, agentdetails: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIC</label>
                    <input
                      type="text"
                      value={searchedFile?.pic || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, pic: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                    <input
                      type="text"
                      value={searchedFile?.bank || ''}
                      onChange={(e) => searchedFile && setSearchedFile({ ...searchedFile, bank: e.target.value })}
                      disabled={!searchedFile}
                      className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 ${
                        searchedFile ? 'bg-white focus:outline-none focus:ring-1 focus:ring-blue-500' : 'bg-gray-100'
                      }`}
                      placeholder=""
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-3 mt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSearchedFile(null);
                      setRefSearchTerm('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Clear
                  </button>
                  {searchedFile && (
                    <>
                    <button
                        onClick={() => handleDeleteFile(searchedFile.reffile)}
                        disabled={isDeletingFile}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 hover:shadow-lg hover:scale-105 transition-all duration-200 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                      >
                        {isDeletingFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete File
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDirectUpdate}
                        disabled={isUpdatingSearchedFile}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                      >
                        {isUpdatingSearchedFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Update File
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-xs sm:max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit File: {editingFile.reffile}</h3>
                <button
                  onClick={() => setEditingFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateFile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference File</label>
                    <input
                      type="text"
                      value={editingFile.reffile}
                      onChange={(e) => setEditingFile({ ...editingFile, reffile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={editingFile.clientname}
                      onChange={(e) => setEditingFile({ ...editingFile, clientname: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={editingFile.year}
                      onChange={(e) => setEditingFile({ ...editingFile, year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={editingFile.category}
                      onChange={(e) => setEditingFile({ ...editingFile, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={editingFile.type}
                      onChange={(e) => setEditingFile({ ...editingFile, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kotak</label>
                    <input
                      type="text"
                      value={editingFile.kotak}
                      onChange={(e) => setEditingFile({ ...editingFile, kotak: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Client</label>
                    <input
                      type="text"
                      value={editingFile.phoneClient}
                      onChange={(e) => setEditingFile({ ...editingFile, phoneClient: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode No</label>
                    <input
                      type="text"
                      value={editingFile.barcodeno}
                      onChange={(e) => setEditingFile({ ...editingFile, barcodeno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                    <input
                      type="text"
                      value={editingFile.agentdetails}
                      onChange={(e) => setEditingFile({ ...editingFile, agentdetails: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIC</label>
                    <input
                      type="text"
                      value={editingFile.pic}
                      onChange={(e) => setEditingFile({ ...editingFile, pic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                    <input
                      type="text"
                      value={editingFile.bank}
                      onChange={(e) => setEditingFile({ ...editingFile, bank: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      value={editingFile.location}
                      onChange={(e) => setEditingFile({ ...editingFile, location: e.target.value })}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status (Computed from Year)</label>
                    <input
                      type="text"
                      value={editingFile.status || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Status is automatically calculated from year
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Safekeeping</label>
                    <input
                      type="text"
                      value={editingFile.safekeeping || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Safekeeping cannot be edited
                    </p>
                  </div>
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
                    disabled={isUpdatingFile}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {isUpdatingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update'
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