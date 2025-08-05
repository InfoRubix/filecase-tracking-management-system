'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  PencilIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
  MapPinIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  IdentificationIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface FileCase {
  id: string;
  year: string;
  category: string;
  type: string;
  kotak: string;
  reffile: string;
  clientname: string;
  'nophone:client': string;
  barcodeno: string;
  safekeeping: string;
  agentdetails: string;
  pic: string;
  bank: string;
  location: string;
  status?: 'Active' | 'Inactive' | 'Archive'; // Computed field based on year
  rack?: string; // Optional since it comes from RACK_LOOKUP
}

export default function AdminDashboard() {
  const [files, setFiles] = useState<FileCase[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileCase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<FileCase | null>(null);
  const [viewingFile, setViewingFile] = useState<FileCase | null>(null);
  const [updateForm, setUpdateForm] = useState({ location: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadFiles();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = files.filter(file => {
        const reffile = (file.reffile || '').toString().toLowerCase();
        const clientname = (file.clientname || '').toString().toLowerCase();
        const category = (file.category || '').toString().toLowerCase();
        const barcodeno = (file.barcodeno || '').toString().toLowerCase();
        const year = (file.year || '').toString().toLowerCase();
        const type = (file.type || '').toString().toLowerCase();
        
        return reffile.includes(searchLower) ||
               clientname.includes(searchLower) ||
               category.includes(searchLower) ||
               barcodeno.includes(searchLower) ||
               year.includes(searchLower) ||
               type.includes(searchLower);
      });
      setFilteredFiles(filtered);
      setCurrentPage(1); // Reset to first page when searching
    } else {
      setFilteredFiles(files);
      setCurrentPage(1); // Reset to first page when clearing search
    }
  }, [searchTerm, files]);

  const checkAuthAndLoadFiles = async () => {
    console.log('Dashboard: Starting to load files...');
    try {
      console.log('Dashboard: Checking authentication...');
      const authResponse = await fetch('/api/auth/verify');
      if (!authResponse.ok) {
        console.log('Dashboard: Authentication failed, redirecting...');
        router.push('/admin');
        return;
      }

      console.log('Dashboard: Authentication passed, fetching files...');
      const filesResponse = await fetch('/api/files/all');
      const result = await filesResponse.json();
      
      console.log('Dashboard: Files API response:', { success: result.success, dataLength: result.data?.length, dataType: Array.isArray(result.data) ? 'array' : typeof result.data });
      
      if (result.success && Array.isArray(result.data)) {
        console.log('Dashboard: Starting to process', result.data.length, 'files...');
        // Ensure all string fields are properly defined
        const cleanedData = result.data.map((file: any, index: number): FileCase | null => {
          try {
            const mappedFile = {
              ...file,
              reffile: file.reffile || '',
              clientname: file.clientname || '',
              category: file.category || '',
              barcodeno: file.barcodeno || '',
              year: file.year || '',
              type: file.type || '',
              location: file.location || '',
              rack: file.rack || ''
            };
            
            if (index < 3) {
              console.log(`Dashboard: Processing file ${index + 1}:`, { reffile: mappedFile.reffile, year: mappedFile.year });
            }
          
          // Compute status based on year with robust error handling
          try {
            const currentYear = new Date().getFullYear();
            let fileYear = currentYear; // Default to current year
            
            // Safely parse year
            if (mappedFile.year && mappedFile.year.toString().trim()) {
              const yearString = mappedFile.year.toString().trim();
              const parsedYear = parseInt(yearString);
              
              // Validate year is reasonable (between 2000 and current year + 1)
              if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= currentYear + 1) {
                fileYear = parsedYear;
              } else {
                console.warn(`Invalid year found for file ${mappedFile.reffile}: "${yearString}". Using current year as fallback.`);
              }
            } else {
              console.warn(`Missing or empty year for file ${mappedFile.reffile}. Using current year as fallback.`);
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
          } catch (fileError) {
            console.error(`Dashboard: Error processing file ${index + 1}:`, fileError, file);
            return null; // Skip problematic files
          }
        }).filter((file: FileCase | null): file is FileCase => file !== null); // Remove null entries
        
        console.log('Dashboard: Successfully processed', cleanedData.length, 'files');
        setFiles(cleanedData);
        setFilteredFiles(cleanedData);
      } else {
        console.warn('Dashboard: No file data or invalid format. API response:', result);
        setFiles([]);
        setFilteredFiles([]);
      }
    } catch (error) {
      console.error('Dashboard: Critical error loading data:', error);
      setFiles([]);
      setFilteredFiles([]);
      // Don't redirect on error, just show empty state
    } finally {
      console.log('Dashboard: Finished loading process');
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
          activity: 'File location updated',
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
      } else {
        alert('Update failed: ' + result.data);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred while updating the file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Single clean loading spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          
          {/* Loading text with dots animation */}
          <div className="text-lg text-gray-700 font-medium">
            Loading files
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-500">Developed by <span className="font-semibold text-orange-600">RUBIX TECHNOLOGY</span></p>
              </div>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4 ml-auto">
              <a
                href="/admin/racks"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <CubeIcon className="mr-2 h-4 w-4" />
                Racks & Box
              </a>
              <a
                href="/admin/manage"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Manage Files
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
                  href="/admin/racks"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <CubeIcon className="mr-3 h-5 w-5 text-blue-500" />
                    Racks & Box
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
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Search files..."
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  File Cases
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredFiles.length} total files • Showing {Math.min(filesPerPage, filteredFiles.length)} per page
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {filteredFiles.length} Files
                </span>
              </div>
            </div>
          </div>
          {(() => {
            // Pagination calculations
            const indexOfLastFile = currentPage * filesPerPage;
            const indexOfFirstFile = indexOfLastFile - filesPerPage;
            const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
            const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

            const PaginationControls = () => (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{indexOfFirstFile + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastFile, filteredFiles.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredFiles.length}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const isCurrentPage = page === currentPage;
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        if (!showPage) {
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              isCurrentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            );

            return (
              <>
                {/* Top Pagination Controls */}
                {totalPages > 1 && <PaginationControls />}
                
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference File
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client Name
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentFiles.map((file) => (
                          <tr 
                            key={file.reffile}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            onClick={() => setViewingFile(file)}
                          >
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-blue-600 max-w-xs truncate" title={file.reffile}>
                                    {file.reffile}
                                  </div>
                                  {file.barcodeno && (
                                    <div className="text-xs text-gray-500">
                                      Barcode: {file.barcodeno}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={file.clientname}>
                                {file.clientname}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{file.category}</div>
                              {file.type && (
                                <div className="text-xs text-gray-500">{file.type}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {file.year}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                file.status?.toLowerCase() === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : file.status?.toLowerCase() === 'inactive'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {file.status}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={file.location}>
                                {file.location}
                              </div>
                              {file.rack && (
                                <div className="text-xs text-gray-500">Rack: {file.rack}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(file);
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <PencilIcon className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {currentFiles.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria.</p>
                    </div>
                  )}
                </div>

                {/* Bottom Pagination Controls */}
                {totalPages > 1 && <PaginationControls />}
              </>
            );
          })()}
        </div>
      </div>

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
          <div className="relative w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl bg-white rounded-xl shadow-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
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
                      {viewingFile['nophone:client'] && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-emerald-600 mr-2" />
                          <div>
                            <p className="text-xs font-medium text-emerald-700">Phone Number</p>
                            <p className="text-sm text-emerald-900">{viewingFile['nophone:client']}</p>
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
                      {viewingFile.rack && (
                        <div className="flex items-center">
                          <CubeIcon className="h-4 w-4 text-orange-600 mr-2" />
                          <div>
                            <p className="text-xs font-medium text-orange-700">Rack</p>
                            <p className="text-sm text-orange-900">{viewingFile.rack}</p>
                          </div>
                        </div>
                      )}
                      {viewingFile.kotak && (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-orange-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <div>
                            <p className="text-xs font-medium text-orange-700">Kotak</p>
                            <p className="text-sm text-orange-900">{viewingFile.kotak}</p>
                          </div>
                        </div>
                      )}
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
    </div>
  );
}