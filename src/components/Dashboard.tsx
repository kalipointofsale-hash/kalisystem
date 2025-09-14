import React, { useState, useEffect } from 'react';
import { useTelegram } from './TelegramProvider';
import { googleSheetsService, MetricsResponse } from '../services/googleSheets';
import { 
  Activity, 
  Database, 
  Server, 
  Users, 
  Wifi, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react';

import type { EnvironmentMetrics, ConnectionQuality } from '../services/googleSheets';

export const Dashboard: React.FC = () => {
  const { user, hapticFeedback, showAlert } = useTelegram();
  const [metrics, setMetrics] = useState<EnvironmentMetrics | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({
    telegram: 'offline',
    database: 'offline',
    googleSheets: 'offline',
    miniApp: 'offline'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      hapticFeedback.light();

      // Fetch metrics from Google Sheets service
      const data: MetricsResponse = await googleSheetsService.getMetrics();
      setMetrics(data.metrics);
      setConnectionQuality(data.connectionQuality);
      setLastUpdated(new Date());
      hapticFeedback.success();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      hapticFeedback.error();
      await showAlert('Failed to fetch metrics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-yellow-500" />;
      case 'poor':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'offline':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-orange-600 bg-orange-50';
      case 'offline':
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatUptime = (uptime: string) => {
    return uptime || '0d 0h 0m';
  };

  const formatResponseTime = (time: number) => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tg-bg-color,#ffffff)]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--tg-link-color,#0088cc)]" />
          <p className="text-[var(--tg-text-color,#000000)] text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--tg-bg-color,#ffffff)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--tg-text-color,#000000)]">
              Environment Dashboard
            </h1>
            <p className="text-[var(--tg-hint-color,#999999)] text-sm">
              Real-time metrics and connection quality
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--tg-button-color,#0088cc)] text-white rounded-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Connection Quality Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Wifi className="w-6 h-6 text-[var(--tg-link-color,#0088cc)]" />
              {getStatusIcon(connectionQuality.telegram)}
            </div>
            <h3 className="font-semibold text-[var(--tg-text-color,#000000)] text-sm">Telegram</h3>
            <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(connectionQuality.telegram)}`}>
              {connectionQuality.telegram}
            </p>
          </div>

          <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-6 h-6 text-[var(--tg-link-color,#0088cc)]" />
              {getStatusIcon(connectionQuality.database)}
            </div>
            <h3 className="font-semibold text-[var(--tg-text-color,#000000)] text-sm">Database</h3>
            <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(connectionQuality.database)}`}>
              {connectionQuality.database}
            </p>
          </div>

          <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-6 h-6 text-[var(--tg-link-color,#0088cc)]" />
              {getStatusIcon(connectionQuality.googleSheets)}
            </div>
            <h3 className="font-semibold text-[var(--tg-text-color,#000000)] text-sm">Google Sheets</h3>
            <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(connectionQuality.googleSheets)}`}>
              {connectionQuality.googleSheets}
            </p>
          </div>

          <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-6 h-6 text-[var(--tg-link-color,#0088cc)]" />
              {getStatusIcon(connectionQuality.miniApp)}
            </div>
            <h3 className="font-semibold text-[var(--tg-text-color,#000000)] text-sm">Mini App</h3>
            <p className={`text-xs px-2 py-1 rounded-full ${getStatusColor(connectionQuality.miniApp)}`}>
              {connectionQuality.miniApp}
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6" />
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm opacity-90">Active Users</h3>
              <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              <p className="text-xs opacity-75">of {metrics.totalUsers} total</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6" />
                <CheckCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm opacity-90">Success Rate</h3>
              <p className="text-2xl font-bold">{metrics.successRate}%</p>
              <p className="text-xs opacity-75">{metrics.errorCount} errors</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Server className="w-6 h-6" />
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm opacity-90">Response Time</h3>
              <p className="text-2xl font-bold">{formatResponseTime(metrics.apiResponseTime)}</p>
              <p className="text-xs opacity-75">average</p>
            </div>
          </div>
        )}

        {/* System Status */}
        {metrics && (
          <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--tg-text-color,#000000)] mb-4">
              System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)] text-sm">Bot Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(metrics.botStatus)}
                    <span className="text-[var(--tg-text-color,#000000)] text-sm capitalize">
                      {metrics.botStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)] text-sm">Database Connections</span>
                  <span className="text-[var(--tg-text-color,#000000)] text-sm">
                    {metrics.databaseConnections}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)] text-sm">Memory Usage</span>
                  <span className="text-[var(--tg-text-color,#000000)] text-sm">
                    {metrics.memoryUsage}%
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)] text-sm">Uptime</span>
                  <span className="text-[var(--tg-text-color,#000000)] text-sm">
                    {formatUptime(metrics.uptime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)] text-sm">Last Updated</span>
                  <span className="text-[var(--tg-text-color,#000000)] text-sm">
                    {lastUpdated?.toLocaleTimeString() || 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)] text-sm">Environment</span>
                  <span className="text-green-600 text-sm font-medium">Production</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Sheets Integration Status */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-[var(--tg-text-color,#000000)]">
              Google Sheets Integration
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-[var(--tg-text-color,#000000)] mb-2">Data Sync</h3>
              <p className="text-[var(--tg-hint-color,#999999)] text-sm mb-2">
                Metrics are automatically synced to Google Sheets for analysis and reporting.
              </p>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 text-sm">Connected & Syncing</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-[var(--tg-text-color,#000000)] mb-2">Last Sync</h3>
              <p className="text-[var(--tg-hint-color,#999999)] text-sm mb-2">
                {lastUpdated?.toLocaleString() || 'Initializing...'}
              </p>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 text-sm">Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[var(--tg-hint-color,#999999)] text-xs">
            Dashboard powered by Google Sheets API • Auto-refresh every 30s
          </p>
        </div>
      </div>
    </div>
  );
};
