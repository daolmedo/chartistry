export interface ChartResponse {
  chartCode: string;
  message: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export async function generateChart(message: string): Promise<ChartResponse> {
  try {
    const response = await fetch('/api/generate-chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'Failed to generate chart');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating chart:', error);
    throw error;
  }
}