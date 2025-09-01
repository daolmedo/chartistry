export interface ChartConfig {
  type: string;
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
  options: {
    responsive: boolean;
    plugins: {
      legend: {
        position: string;
      };
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}

export interface ChartResponse {
  config: ChartConfig;
  message: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface Dataset {
  dataset_id: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  upload_date: string;
  ingestion_status: 'pending' | 'processing' | 'completed' | 'failed';
  table_name?: string;
}

export interface DatasetColumn {
  column_name: string;
  data_type: string;
  sample_values: any[];
  unique_count: number;
}

export interface UploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  fileId: string;
  datasetId: string;
  s3Key: string;
  expiresIn: number;
}

export interface IngestionResponse {
  message: string;
  tableName: string;
  rowsInserted: number;
  columns: number;
}

export async function generateChart(message: string): Promise<ChartResponse> {
  try {
    // Create abort controller for timeout (2 minutes for AI-driven chart generation)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
    
    const response = await fetch('/api/generate-chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to generate chart');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Chart generation timed out. Please try again with a simpler request or a smaller dataset.');
    }
    console.error('Error generating chart:', error);
    throw error;
  }
}

export async function getUploadUrl(userId: string, fileName: string): Promise<UploadResponse> {
  try {
    const response = await fetch('/api/datasets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'upload',
        userId,
        fileName,
        fileType: 'text/csv'
      }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

export async function uploadFileToS3(uploadUrl: string, fields: Record<string, string>, file: File): Promise<void> {
  try {
    const formData = new FormData();
    
    // Add all the fields from the presigned POST
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add the file last
    formData.append('file', file);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

export async function ingestDataset(userId: string, datasetId: string, s3Key: string, originalFilename: string): Promise<IngestionResponse> {
  try {
    const response = await fetch('/api/datasets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ingest',
        userId,
        datasetId,
        s3Key,
        originalFilename
      }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to ingest dataset');
    }

    return await response.json();
  } catch (error) {
    console.error('Error ingesting dataset:', error);
    throw error;
  }
}

export async function getUserDatasets(userId: string): Promise<Dataset[]> {
  try {
    const response = await fetch(`/api/datasets?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to fetch datasets');
    }

    const data = await response.json();
    return data.datasets;
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
}

export interface UserProfile {
  user_id: string;
  email: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  subscription_tier: string;
  total_datasets: number;
  total_charts_generated: number;
}

export interface CreateUserResponse {
  message: string;
  user: UserProfile;
}

export interface GetUserResponse {
  user: UserProfile;
}

export interface UpdateUserResponse {
  message: string;
  user: UserProfile;
}

export async function createUserProfile(userId: string, email: string, displayName?: string): Promise<CreateUserResponse> {
  try {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        user_id: userId,
        email,
        display_name: displayName,
      }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to create user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<GetUserResponse> {
  try {
    const response = await fetch(`/api/customers?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to get user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, email?: string, displayName?: string): Promise<UpdateUserResponse> {
  try {
    const response = await fetch('/api/customers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        email,
        display_name: displayName,
      }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to update user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}