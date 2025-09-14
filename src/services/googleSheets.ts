// Google Sheets integration service
// This runs on the client side and communicates with our Edge Function

export interface EnvironmentMetrics {
  timestamp: string;
  botStatus: 'online' | 'offline' | 'error';
  databaseConnections: number;
  activeUsers: number;
  totalUsers: number;
  apiResponseTime: number;
  successRate: number;
  errorCount: number;
  memoryUsage: number;
  uptime: string;
}

export interface ConnectionQuality {
  telegram: 'excellent' | 'good' | 'poor' | 'offline';
  database: 'excellent' | 'good' | 'poor' | 'offline';
  googleSheets: 'excellent' | 'good' | 'poor' | 'offline';
  miniApp: 'excellent' | 'good' | 'poor' | 'offline';
}

export interface MetricsResponse {
  metrics: EnvironmentMetrics;
  connectionQuality: ConnectionQuality;
}

class GoogleSheetsService {
  private baseUrl: string;

  constructor() {
    // Use the Supabase Edge Function URL
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`;
  }

  async getMetrics(): Promise<MetricsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  async writeMetrics(metrics: EnvironmentMetrics, connectionQuality: ConnectionQuality): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          connectionQuality
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error writing metrics:', error);
      return false;
    }
  }

  // Helper method to format metrics for display
  formatMetrics(metrics: EnvironmentMetrics): Record<string, string> {
    return {
      'Bot Status': metrics.botStatus.toUpperCase(),
      'Active Users': `${metrics.activeUsers} / ${metrics.totalUsers}`,
      'Success Rate': `${metrics.successRate}%`,
      'Response Time': metrics.apiResponseTime < 1000 
        ? `${metrics.apiResponseTime}ms` 
        : `${(metrics.apiResponseTime / 1000).toFixed(1)}s`,
      'Memory Usage': `${metrics.memoryUsage}%`,
      'Uptime': metrics.uptime,
      'Error Count': metrics.errorCount.toString(),
      'DB Connections': metrics.databaseConnections.toString(),
    };
  }

  // Helper method to get overall system health
  getSystemHealth(connectionQuality: ConnectionQuality): 'excellent' | 'good' | 'poor' | 'critical' {
    const qualities = Object.values(connectionQuality);
    const excellentCount = qualities.filter(q => q === 'excellent').length;
    const goodCount = qualities.filter(q => q === 'good').length;
    const poorCount = qualities.filter(q => q === 'poor').length;
    const offlineCount = qualities.filter(q => q === 'offline').length;

    if (offlineCount > 1) return 'critical';
    if (poorCount > 1) return 'poor';
    if (excellentCount >= 3) return 'excellent';
    return 'good';
  }
}

export const googleSheetsService = new GoogleSheetsService();