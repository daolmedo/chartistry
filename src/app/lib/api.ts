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