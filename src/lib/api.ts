const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function searchFile(searchTerm: string, searchType: string = 'auto') {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: null,
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }
  
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=searchFile&searchTerm=${encodeURIComponent(searchTerm)}&searchType=${searchType}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<any> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getAllFiles() {
  console.log('getAllFiles: Starting...');
  console.log('getAllFiles: GOOGLE_SCRIPT_URL:', GOOGLE_SCRIPT_URL ? 'configured' : 'NOT configured');
  
  if (!GOOGLE_SCRIPT_URL) {
    console.error('getAllFiles: No Google Script URL configured');
    return {
      success: false,
      data: [],
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=getAllFiles`;
    console.log('getAllFiles: Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('getAllFiles: Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse<any[]> = await response.json();
    console.log('getAllFiles: Success:', { success: result.success, dataLength: result.data?.length });
    return result;
  } catch (error) {
    console.error('getAllFiles: Error:', error);
    return {
      success: false,
      data: [],
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getFileCase() {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: [],
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getFileCase`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<any[]> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: [],
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getRackLookup() {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: [],
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getRackLookup`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<any[]> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: [],
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function updateFile(data: {
  refFile: string;
  activity?: string;
  location?: string;
  updateBy: string;
}) {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: '',
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    console.log('Updating file with data:', data);
    const requestBody = {
      action: 'updateFile',
      ...data
    };
    console.log('Sending request body:', JSON.stringify(requestBody));
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<string> = await response.json();
    console.log('Update response:', result);
    return result;
  } catch (error) {
    console.error('Update file error:', error);
    return {
      success: false,
      data: '',
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function createFile(data: any) {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: '',
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    console.log('Creating file with data:', data);
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createFile',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<string> = await response.json();
    console.log('Create response:', result);
    return result;
  } catch (error) {
    console.error('Create file error:', error);
    return {
      success: false,
      data: '',
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function deleteFile(data: {
  refFile: string;
  deletedBy: string;
}) {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: '',
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    console.log('Deleting file with data:', data);
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteFile',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<string> = await response.json();
    console.log('Delete response:', result);
    return result;
  } catch (error) {
    console.error('Delete file error:', error);
    return {
      success: false,
      data: '',
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function authenticateAdmin(email: string, password: string) {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'authenticate',
      email,
      password
    })
  });
  const result: ApiResponse<{ authenticated: boolean; email: string }> = await response.json();
  return result;
}

export async function getCategories() {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: [],
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCategories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<{id: number, category: string}[]> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: [],
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getTypes() {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: [],
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getTypes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: ApiResponse<{id: number, type: string}[]> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: [],
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function createCategory(category: string) {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: '',
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createCategory',
        category
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<string> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: '',
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function createType(type: string) {
  if (!GOOGLE_SCRIPT_URL) {
    return {
      success: false,
      data: '',
      message: 'Google Script URL not configured. Please check environment variables.'
    };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createType',
        type
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<string> = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      data: '',
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}