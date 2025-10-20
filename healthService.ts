import * as Sensors from 'expo-sensors';
import { Platform, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { stepPersistence, DailyStepData } from './StepPersistence';

export interface SleepData {
  date: string;
  hours: number;
}

export interface StepDataResult {
  steps: number;
  distance: number; // in meters
}

class HealthService {
  private rawStepCount = 0;
  private subscription: any = null;
  private isInitialized = false;
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 3000; // Update every 3 seconds
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 10; // Only update if steps change by more than 10

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const currentStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
        );
        
        if (currentStatus) return true;

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: 'Activity Recognition Permission',
            message: 'This app needs access to your activity data to track steps.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.MOTION);
        if (status === RESULTS.GRANTED) return true;
        
        const requestStatus = await request(PERMISSIONS.IOS.MOTION);
        return requestStatus === RESULTS.GRANTED;
      }
      return false;
    } catch (err) {
      console.warn('Error requesting permissions:', err);
      return false;
    }
  }

  async checkStepTrackingAvailability(): Promise<boolean> {
    try {
      return await Sensors.Pedometer.isAvailableAsync();
    } catch (error) {
      console.error('Error checking step tracking availability:', error);
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissions not granted for step tracking');
      }

      // Check availability
      const isAvailable = await this.checkStepTrackingAvailability();
      if (!isAvailable) {
        throw new Error('Step tracking not available on this device');
      }

      // Initialize step persistence
      await stepPersistence.initializeDailyTracking();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('HealthService initialization failed:', error);
      return false;
    }
  }

  async getStepData(): Promise<StepDataResult> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Health service not initialized');
      }

      const todayStats = await stepPersistence.getTodayStats();
      return todayStats;
    } catch (error) {
      console.error('Error getting step data:', error);
      throw error;
    }
  }

  async watchStepCount(callback: (data: StepDataResult) => void): Promise<() => void> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('Cannot watch step count - service not initialized');
        return () => {};
      }

      // Remove existing subscription
      if (this.subscription) {
        this.subscription.remove();
      }

      let lastReportedSteps = 0;
      
      this.subscription = Sensors.Pedometer.watchStepCount(async (result) => {
        try {
          const now = Date.now();
          
          // Throttle updates
          if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
            return;
          }
          
          const newRawSteps = result.steps || 0;
          
          // Only process if there's a significant change
          if (Math.abs(newRawSteps - this.rawStepCount) < this.SIGNIFICANT_CHANGE_THRESHOLD && 
              this.rawStepCount > 0) {
            return;
          }
          
          this.rawStepCount = newRawSteps;
          this.lastUpdateTime = now;
          
          // Update today's step data
          const todayData = await stepPersistence.updateTodaySteps(this.rawStepCount);
          
          // Only call callback if steps have changed significantly
          if (Math.abs(todayData.steps - lastReportedSteps) >= this.SIGNIFICANT_CHANGE_THRESHOLD || 
              lastReportedSteps === 0) {
            lastReportedSteps = todayData.steps;
            callback(todayData);
          }
          
        } catch (error) {
          console.error('Error processing step count update:', error);
        }
      });

      return () => {
        if (this.subscription) {
          this.subscription.remove();
          this.subscription = null;
        }
      };
    } catch (error) {
      console.error('Error setting up step listener:', error);
      return () => {};
    }
  }

  // Get today's step count and distance
  async getTodayStepData(): Promise<StepDataResult> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Health service not initialized');
      }

      if (Platform.OS === 'ios') {
        // iOS supports date range queries
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const result = await Sensors.Pedometer.getStepCountAsync(startOfDay, now);
        const steps = result.steps || 0;
        const distance = steps * 0.762; // Average step length in meters
        
        // Save to persistence
        const today = now.toISOString().split('T')[0];
        await stepPersistence.saveStepData(today, steps);
        
        return { steps, distance: Math.round(distance * 100) / 100 };
      } else {
        // Android: Use persistence calculation
        let todayData = await stepPersistence.getTodayStats();
        
        // If we have raw step count, update with latest
        if (this.rawStepCount > 0) {
          todayData = await stepPersistence.updateTodaySteps(this.rawStepCount);
        }
        
        return todayData;
      }
    } catch (error) {
      console.error('Error getting today step data:', error);
      throw error;
    }
  }

  // Get step data for a specific date
  async getStepDataForDate(date: string): Promise<StepDataResult> {
    try {
      const steps = await stepPersistence.getSavedStepCount(date);
      const distance = await stepPersistence.getSavedDistance(date);
      return { steps, distance };
    } catch (error) {
      console.error('Error getting step data for date:', error);
      return { steps: 0, distance: 0 };
    }
  }

  // Get weekly step data with distance
  async getWeeklyStepData(): Promise<Array<{date: string, steps: number, distance: number}>> {
    try {
      const weeklyData = await stepPersistence.getWeeklyStepData();
      return weeklyData.map((data: DailyStepData) => ({
        date: data.date,
        steps: data.steps,
        distance: data.distance
      }));
    } catch (error) {
      console.error('Error getting weekly step data:', error);
      return [];
    }
  }

  // Sync step data with external database
  async syncStepData(syncFunction: (data: DailyStepData[]) => Promise<boolean>): Promise<boolean> {
    try {
      return await stepPersistence.syncWithDatabase(syncFunction);
    } catch (error) {
      console.error('Error syncing step data:', error);
      return false;
    }
  }

  // Manual refresh - useful for pull-to-refresh
  async refreshStepData(): Promise<StepDataResult> {
    try {
      if (Platform.OS === 'ios') {
        return await this.getTodayStepData();
      } else {
        // For Android, trigger an update with current raw count
        if (this.rawStepCount > 0) {
          return await stepPersistence.updateTodaySteps(this.rawStepCount);
        } else {
          // Return saved data
          return await stepPersistence.getTodayStats();
        }
      }
    } catch (error) {
      console.error('Error refreshing step data:', error);
      throw error;
    }
  }

  // Clean old step data
  async cleanOldData(): Promise<void> {
    try {
      await stepPersistence.cleanOldStepData();
    } catch (error) {
      console.error('Error cleaning old data:', error);
    }
  }

  // Get current raw step count (for debugging)
  getRawStepCount(): number {
    return this.rawStepCount;
  }

  // Check if service is initialized
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  // Force re-initialization
  async reinitialize(): Promise<boolean> {
    this.isInitialized = false;
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    return await this.initialize();
  }
}

export default new HealthService();