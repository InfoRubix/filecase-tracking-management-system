export interface FileCase {
  id: string;
  year: string;
  category: string;
  type: string;
  kotak: string;
  reffile: string;
  clientname: string;
  'nophoneclient': string;
  barcodeno: string;
  safekeeping: string;
  agentdetails: string;
  pic: string;
  bank: string;
  location: string;
  status?: 'Active' | 'Inactive' | 'Archive'; // Computed field based on year
}

export interface RackLookup {
  id: string;
  kotak: string;
  rack: string;
}

export interface LogEntry {
  id: string;
  datetime: string;
  reffile: string;
  activity: string;
  location: string;
  updatedby: string;
}

export interface Admin {
  email: string;
  password: string;
}