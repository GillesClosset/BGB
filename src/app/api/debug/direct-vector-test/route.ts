import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface RequestInfo {
  text: string;
  headers: Record<string, string>;
  url: string;
  method?: string;
}

interface ResponseInfo {
  method1?: {
    status?: number;
    success?: boolean;
    data?: any;
    error?: string;
  };
  method2?: {
    status?: number;
    success?: boolean;
    data?: any;
    error?: string;
  };
  method3?: {
    status?: number;
    success?: boolean;
    data?: any;
    error?: string;
  };
}

interface DiagnosticsInfo {
  httpTest?: {
    url?: string;
    status?: number;
    success?: boolean;
    error?: string;
  };
}

interface DiagnosticReport {
  requestTime: string;
  environment: {
    hasSupabaseUrl: boolean;
    hasServiceKey: boolean;
    vercelUrl: string;
    nodeEnv?: string;
  };
  request: RequestInfo;
  response: ResponseInfo;
  diagnostics: DiagnosticsInfo;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request to get test text
    const body = await request.json();
    const { text = "Board game with strategy and resource management" } = body;
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Prepare diagnostics report
    const report: DiagnosticReport = {
      requestTime: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        vercelUrl: process.env.VERCEL_URL || 'Not set',
        nodeEnv: process.env.NODE_ENV,
      },
      request: {
        text: text,
        headers: {},
        url: ''
      },
      response: {},
      diagnostics: {}
    };

    // Determine what URL to use
    const isProduction = process.env.NODE_ENV === 'production';
    const baseURL = process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000';
    
    // Set up headers and URL for three different test methods
    
    // Method 1: Call using relative URL with x-supabase-auth header
    try {
      report.request.method = "Method 1: Relative URL with header";
      report.request.url = "/api/vector-search";
      
      const headers = {
        'Content-Type': 'application/json',
        'x-supabase-auth': supabaseServiceKey,
      };
      
      report.request.headers = { ...headers, 'x-supabase-auth': 'REDACTED' }; 
      
      const response = await axios.post(
        "/api/vector-search",
        { text, limit: 10, threshold: 0.5 },
        {
          baseURL,
          headers,
        }
      );
      
      report.response.method1 = {
        status: response.status,
        success: true,
        data: response.data
      };
    } catch (error: any) {
      report.response.method1 = {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
    // Method 2: Call using absolute URL with x-supabase-auth header
    try {
      report.request.method = "Method 2: Absolute URL with header";
      const absoluteUrl = `${baseURL}/api/vector-search`;
      report.request.url = absoluteUrl;
      
      const headers = {
        'Content-Type': 'application/json',
        'x-supabase-auth': supabaseServiceKey,
      };
      
      report.request.headers = { ...headers, 'x-supabase-auth': 'REDACTED' };
      
      const response = await axios.post(
        absoluteUrl,
        { text, limit: 10, threshold: 0.5 },
        { headers }
      );
      
      report.response.method2 = {
        status: response.status,
        success: true,
        data: response.data
      };
    } catch (error: any) {
      report.response.method2 = {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
    // Method 3: Call using fetch instead of axios
    try {
      report.request.method = "Method 3: Using fetch API";
      const absoluteUrl = `${baseURL}/api/vector-search`;
      report.request.url = absoluteUrl;
      
      const response = await fetch(absoluteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-supabase-auth': supabaseServiceKey,
        },
        body: JSON.stringify({ text, limit: 10, threshold: 0.5 }),
      });
      
      const data = await response.json();
      
      report.response.method3 = {
        status: response.status,
        success: response.ok,
        data
      };
    } catch (error: any) {
      report.response.method3 = {
        error: error.message,
      };
    }
    
    // Additional diagnostics
    if (isProduction) {
      // Test HTTP vs HTTPS
      try {
        // Try with http (by replacing https)
        const httpUrl = `http://${process.env.VERCEL_URL}/api/vector-search`;
        
        const response = await axios.post(
          httpUrl,
          { text, limit: 10, threshold: 0.5 },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-supabase-auth': supabaseServiceKey,
            }
          }
        );
        
        report.diagnostics.httpTest = {
          url: httpUrl.replace(supabaseServiceKey, 'REDACTED'),
          status: response.status,
          success: true
        };
      } catch (error: any) {
        report.diagnostics.httpTest = {
          error: error.message,
          status: error.response?.status,
        };
      }
    }
    
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      time: new Date().toISOString()
    }, { status: 500 });
  }
} 