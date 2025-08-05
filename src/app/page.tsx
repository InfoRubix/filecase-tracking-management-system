'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface FileResult {
  id: string;
  kotak: string;
  no: string;
  rack: string;
  category: string;
  reffile: string;
  clientname: string;
  'nophoneclient': string;
  barcodeno: string;
  safekeeping: string;
  agentdetails: string;
  pic: string;
  bank: string;
  status: string;
  location: string;
  year?: string; // Year field for status calculation
}

interface SearchResponse {
  files: FileResult[];
  total: number;
  searchTerm: string;
  clientName?: string;
}

interface ErrorResponse {
  message: string;
  searchTerm: string;
  guidance: string[];
  totalRecords: number;
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | ErrorResponse | null>(null);

  // Function to calculate file status based on year
  const calculateFileStatus = (file: FileResult): FileResult => {
    try {
      const currentYear = new Date().getFullYear();
      let fileYear = currentYear; // Default to current year
      
      // Try to get year from file data (could be 'year' or 'YEAR' field)
      const yearField = file.year || (file as any).YEAR || (file as any).Year;
      
      // Safely parse year
      if (yearField && yearField.toString().trim()) {
        const yearString = yearField.toString().trim();
        const parsedYear = parseInt(yearString);
        
        // Validate year is reasonable (between 1980 and current year + 1)
        if (!isNaN(parsedYear) && parsedYear >= 1980 && parsedYear <= currentYear + 1) {
          fileYear = parsedYear;
        }
      }
      
      const age = currentYear - fileYear;
      
      let status: string;
      if (age <= 7) {
        status = 'Active';
      } else if (age <= 10) {
        status = 'Inactive';
      } else {
        status = 'Archive';
      }
      
      return {
        ...file,
        status
      };
    } catch (error) {
      console.error(`Error calculating status for file ${file.reffile}:`, error);
      return {
        ...file,
        status: 'Active' // Default fallback
      };
    }
  };

  const handlePrevFile = () => {
    if (searchResult && currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  const handleNextFile = () => {
    if (searchResult && currentFileIndex < searchResult.files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  const currentFile = searchResult?.files[currentFileIndex];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResult(null);
    setCurrentFileIndex(0);

    try {
      const response = await fetch(`/api/files/search?searchTerm=${encodeURIComponent(searchTerm)}`);
      const result = await response.json();

      if (result.success) {
        // Process search results to calculate status for each file
        const processedData = {
          ...result.data,
          files: result.data.files.map((file: FileResult) => calculateFileStatus(file))
        };
        setSearchResult(processedData);
        setCurrentFileIndex(0); // Reset to first file
      } else {
        // Handle detailed error response with guidance
        if (typeof result.data === 'object' && result.data.guidance) {
          setError(result.data);
        } else {
          setError(result.data || 'File not found');
        }
      }
    } catch (err) {
      setError('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              {/* Centered Company Logo */}
              <div className="text-center mb-4">
                <img 
                  src="/logo AH 2023-03.png" 
                  alt="AH Company Logo" 
                  className="h-20 w-20 mx-auto mb-3 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  File Case Tracking System
                </h1>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs text-gray-400">Developed by</span>
                  <span className="text-sm font-bold text-orange-600">
                    RUBIX TECHNOLOGY
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Search for files using reference number, client name, or barcode
              </p>
            </div>
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Files
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900"
                    placeholder="Search by reference file, client name, or barcode..."
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search File'}
              </button>
            </form>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                {typeof error === 'object' && error !== null && 'guidance' in error ? (
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-3">
                      {error.message} for "{error.searchTerm}"
                    </h3>
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-2">Please try searching with:</p>
                      <ul className="list-none space-y-1">
                        {error.guidance.map((suggestion, index) => (
                          <li key={index} className="text-xs leading-relaxed">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-red-600">
                        Searched {error.totalRecords} records in database
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {typeof error === 'string' ? error : 'An error occurred'}
                      </h3>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Login Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Admin Access</h3>
                  <p className="text-xs text-gray-600 mb-3">Sign in to manage file cases</p>
                  <a
                    href="/admin"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Admin Login
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Side - File Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">File Details</h2>
            
            {!searchResult && !error && !loading && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Enter a search term to view file details</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Searching for file...</p>
                </div>
              </div>
            )}

            {searchResult && currentFile && (
              <div className="space-y-6">
                {/* File Counter and Navigation */}
                {searchResult.total > 1 && (
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-blue-700">
                        📁 {searchResult.total} files found
                      </span>
                      {searchResult.clientName && (
                        <span className="text-xs text-blue-600">for {searchResult.clientName}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={handlePrevFile}
                        disabled={currentFileIndex === 0}
                        className="p-1 rounded-md text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-blue-700 px-2">
                        {currentFileIndex + 1} / {searchResult.total}
                      </span>
                      <button
                        onClick={handleNextFile}
                        disabled={currentFileIndex === searchResult.total - 1}
                        className="p-1 rounded-md text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* File Status Badge */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentFile.reffile}
                  </h3>
                  <span className={`inline-flex items-center px-4 py-2 text-base font-black rounded-lg shadow-sm ${
                    !currentFile.status || currentFile.status.trim() === '' 
                      ? 'bg-gray-100 text-gray-600 border border-gray-300' 
                      : currentFile.status?.toLowerCase() === 'active' 
                        ? 'bg-green-500 text-white shadow-green-200' 
                        : currentFile.status?.toLowerCase() === 'inactive'
                          ? 'bg-red-500 text-white shadow-red-200'
                          : currentFile.status?.toLowerCase() === 'processing'
                            ? 'bg-blue-500 text-white shadow-blue-200'
                            : 'bg-yellow-500 text-white shadow-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        !currentFile.status || currentFile.status.trim() === '' 
                          ? 'bg-gray-400' 
                          : currentFile.status?.toLowerCase() === 'active' 
                            ? 'bg-green-200' 
                            : currentFile.status?.toLowerCase() === 'inactive'
                              ? 'bg-red-200'
                              : currentFile.status?.toLowerCase() === 'processing'
                                ? 'bg-blue-200'
                                : 'bg-yellow-200'
                      }`}></div>
                      <span>{currentFile.status || 'No Status'}</span>
                    </div>
                  </span>
                </div>

                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-3">Client Information</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Client Name</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.clientname || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Phone Number</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.nophoneclient || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* File Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-3">File Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Category</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.category || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Bank</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.bank || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">PIC</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.pic || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Barcode No</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.barcodeno || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-3">Location Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Current Location</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.location || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Rack</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.rack || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide">Kotak</label>
                      <p className="mt-1 text-sm text-gray-900">{currentFile.kotak || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {currentFile.agentdetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-3">Agent Details</h4>
                    <p className="text-sm text-gray-900">{currentFile.agentdetails || 'N/A'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
