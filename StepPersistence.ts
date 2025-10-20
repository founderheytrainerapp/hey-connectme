// src/services/StepPersistence.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEP_KEY_PREFIX = 'daily_steps_';
const LAST_SYNC_KEY = 'last_step_sync_date';
const DAILY_BASELINE_KEY = 'daily_step_baseline_';
const DISTANCE_KEY_PREFIX = 'daily_distance_';

export interface DailyStepData {
  date: string;
  steps: number;
  distance: number; // in meters
  timestamp: number;
  synced: boolean;
}

export interface StepSession {
  startTime: number;
  endTime: number;
  steps: number;
  distance: number;
  date: string;
}

class StepPersistenceManager {
  private currentDate: string = '';
  private dailyBaseline: number = 0;
  private lastSyncDate: string = '';
  private isInitialized: boolean = false;
  private readonly AVERAGE_STEP_LENGTH = 0.762; // meters per step (average adult)

  constructor() {
    this.currentDate = this.getCurrentDateString();
  }

  private getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  private calculateDistance(steps: number): number {
    return Math.round(steps * this.AVERAGE_STEP_LENGTH * 100) / 100; // Round to 2 decimal places
  }

  // Initialize daily tracking
  async initializeDailyTracking(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const today = this.getCurrentDateString();
      this.lastSyncDate = await AsyncStorage.getItem(LAST_SYNC_KEY) || '';
      
      // Check if we need to start a new day
      if (this.lastSyncDate !== today) {
        await this.handleDayTransition(today);
      }
      
      // Load today's baseline
      await this.loadDailyBaseline(today);
      
      // Mark as synced for today
      await AsyncStorage.setItem(LAST_SYNC_KEY, today);
      this.lastSyncDate = today;
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Error initializing daily tracking:', error);
      throw error;
    }
  }

  // Handle day transition (midnight rollover)
  private async handleDayTransition(newDate: string): Promise<void> {
    try {
      // Finalize yesterday's data if it exists
      if (this.lastSyncDate && this.lastSyncDate !== newDate) {
        await this.finalizeYesterdayData();
      }
      
      // Reset for new day
      this.currentDate = newDate;
      this.dailyBaseline = 0;
      
      // Clear any existing baseline for the new day
      await AsyncStorage.removeItem(`${DAILY_BASELINE_KEY}${newDate}`);
      
    } catch (error) {
      console.error('Error handling day transition:', error);
    }
  }

  // Finalize yesterday's step data
  private async finalizeYesterdayData(): Promise<void> {
    try {
      const yesterday = this.getYesterdayDateString();
      const existingData = await this.getStepData(yesterday);
      
      if (existingData && existingData.steps > 0) {
        // Mark as finalized and ready for sync
        existingData.synced = false;
        existingData.timestamp = Date.now();
        
        await AsyncStorage.setItem(
          `${STEP_KEY_PREFIX}${yesterday}`,
          JSON.stringify(existingData)
        );
      }
    } catch (error) {
      console.error('Error finalizing yesterday data:', error);
    }
  }

  // Load daily baseline (steps at start of day)
  private async loadDailyBaseline(date: string): Promise<void> {
    try {
      const baselineStr = await AsyncStorage.getItem(`${DAILY_BASELINE_KEY}${date}`);
      this.dailyBaseline = baselineStr ? parseInt(baselineStr, 10) : 0;
    } catch (error) {
      console.error('Error loading daily baseline:', error);
      this.dailyBaseline = 0;
    }
  }

  // Set daily baseline (called when day starts or app initializes)
  async setDailyBaseline(rawSteps: number): Promise<void> {
    try {
      const today = this.getCurrentDateString();
      
      // Only set baseline if we don't have one for today
      const existing = await AsyncStorage.getItem(`${DAILY_BASELINE_KEY}${today}`);
      if (!existing && rawSteps > 0) {
        this.dailyBaseline = rawSteps;
        await AsyncStorage.setItem(`${DAILY_BASELINE_KEY}${today}`, rawSteps.toString());
      }
    } catch (error) {
      console.error('Error setting daily baseline:', error);
    }
  }

  // Calculate today's actual steps (raw steps - baseline)
  calculateTodaySteps(rawSteps: number): number {
    return Math.max(0, rawSteps - this.dailyBaseline);
  }

  // Save step count and distance for a specific date
  async saveStepData(date: string, steps: number): Promise<void> {
    try {
      const distance = this.calculateDistance(steps);
      const stepData: DailyStepData = {
        date,
        steps,
        distance,
        timestamp: Date.now(),
        synced: false
      };
      
      await AsyncStorage.setItem(
        `${STEP_KEY_PREFIX}${date}`,
        JSON.stringify(stepData)
      );
      
    } catch (error) {
      console.error('Error saving step data:', error);
      throw error;
    }
  }

  // Get saved step count for a specific date
  async getSavedStepCount(date: string): Promise<number> {
    try {
      const data = await this.getStepData(date);
      return data ? data.steps : 0;
    } catch (error) {
      console.error('Error retrieving step count:', error);
      return 0;
    }
  }

  // Get saved distance for a specific date
  async getSavedDistance(date: string): Promise<number> {
    try {
      const data = await this.getStepData(date);
      return data ? data.distance : 0;
    } catch (error) {
      console.error('Error retrieving distance:', error);
      return 0;
    }
  }

  // Get step data with metadata
  async getStepData(date: string): Promise<DailyStepData | null> {
    try {
      const data = await AsyncStorage.getItem(`${STEP_KEY_PREFIX}${date}`);
      if (data) {
        const parsedData = JSON.parse(data);
        // Ensure distance is calculated if missing (for backward compatibility)
        if (parsedData.distance === undefined) {
          parsedData.distance = this.calculateDistance(parsedData.steps);
        }
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving step data:', error);
      return null;
    }
  }

  // Update today's step count with optimized persistence
  async updateTodaySteps(rawSteps: number): Promise<{ steps: number; distance: number }> {
    try {
      const today = this.getCurrentDateString();
      
      // Check for day transition
      if (this.currentDate !== today) {
        await this.handleDayTransition(today);
      }
      
      // Set baseline if this is the first reading of the day
      if (this.dailyBaseline === 0 && rawSteps > 0) {
        await this.setDailyBaseline(rawSteps);
      }
      
      // Calculate today's actual steps
      const todaySteps = this.calculateTodaySteps(rawSteps);
      const todayDistance = this.calculateDistance(todaySteps);
      
      // Save the step data
      await this.saveStepData(today, todaySteps);
      
      return { steps: todaySteps, distance: todayDistance };
    } catch (error) {
      console.error('Error updating today steps:', error);
      return { steps: 0, distance: 0 };
    }
  }

  // Get unsynced step data for database sync
  async getUnsyncedStepData(): Promise<DailyStepData[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stepKeys = keys.filter(key => key.startsWith(STEP_KEY_PREFIX));
      
      const unsyncedData: DailyStepData[] = [];
      
      for (const key of stepKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const stepData: DailyStepData = JSON.parse(data);
          if (!stepData.synced && stepData.steps > 0) {
            // Ensure distance is calculated
            if (stepData.distance === undefined) {
              stepData.distance = this.calculateDistance(stepData.steps);
            }
            unsyncedData.push(stepData);
          }
        }
      }
      
      return unsyncedData.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting unsynced step data:', error);
      return [];
    }
  }

  // Mark step data as synced
  async markAsSynced(date: string): Promise<void> {
    try {
      const stepData = await this.getStepData(date);
      if (stepData) {
        stepData.synced = true;
        await AsyncStorage.setItem(
          `${STEP_KEY_PREFIX}${date}`,
          JSON.stringify(stepData)
        );
      }
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  }

  // Get weekly step data
  async getWeeklyStepData(endDate?: string): Promise<DailyStepData[]> {
    try {
      const end = endDate ? new Date(endDate) : new Date();
      const weeklyData: DailyStepData[] = [];
      
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(end);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const stepData = await this.getStepData(dateStr);
        if (stepData) {
          weeklyData.push(stepData);
        } else {
          // Create empty data for missing days
          weeklyData.push({
            date: dateStr,
            steps: 0,
            distance: 0,
            timestamp: date.getTime(),
            synced: true
          });
        }
      }
      
      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly step data:', error);
      return [];
    }
  }

  // Clean old step data (keep last 30 days)
  async cleanOldStepData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const keys = await AsyncStorage.getAllKeys();
      const stepKeys = keys.filter(key => key.startsWith(STEP_KEY_PREFIX));
      
      const keysToDelete = [];
      for (const key of stepKeys) {
        const date = key.replace(STEP_KEY_PREFIX, '');
        if (date < cutoffDate) {
          keysToDelete.push(key);
          keysToDelete.push(`${DAILY_BASELINE_KEY}${date}`);
        }
      }
      
      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }
    } catch (error) {
      console.error('Error cleaning old step data:', error);
    }
  }

  // Sync with external database
  async syncWithDatabase(syncFunction: (data: DailyStepData[]) => Promise<boolean>): Promise<boolean> {
    try {
      const unsyncedData = await this.getUnsyncedStepData();
      
      if (unsyncedData.length === 0) {
        return true;
      }
      
      const success = await syncFunction(unsyncedData);
      
      if (success) {
        // Mark all as synced
        await Promise.all(
          unsyncedData.map(data => this.markAsSynced(data.date))
        );
      }
      
      return success;
    } catch (error) {
      console.error('Error syncing with database:', error);
      return false;
    }
  }

  // Get current stats for today
  async getTodayStats(): Promise<{ steps: number; distance: number }> {
    try {
      const today = this.getCurrentDateString();
      const data = await this.getStepData(today);
      
      if (data) {
        return { steps: data.steps, distance: data.distance };
      }
      
      return { steps: 0, distance: 0 };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return { steps: 0, distance: 0 };
    }
  }
}

// Export singleton instance
export const stepPersistence = new StepPersistenceManager();