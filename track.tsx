import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { format } from "date-fns";
import GlassBackground from "../../../src/components/GlassBackground";
import CustomHeader from "../../../src/components/CustomHeader";
import States from "@/components/tracking/states";
import Timeline from "@/components/tracking/timeline";
import HorizontalDateStrip from "@/components/calender/HorizontalCalendar";
import BCalendar from "@/components/calender/BCalendar";
import { useAppTheme } from "@/hooks/useAppTheme";
import HealthBanner from "../../../src/components/tracking/HealthBanner";
import { useUser } from "../../../src/contexts/UserContext";
import { HeartRateWidget } from "../../../src/components/activityWidgets";
import HealthActivity from "../../../src/components/tracking/HealthAcivities";

const TrackTabs = () => {
  const [activeTab, setActiveTab] = useState<`Today's Activity` | "Your Plan">(
    `Today's Activity`
  );

  const theme = useAppTheme();

  // ✅ Date and Calendar state (for "Your Plan")
  const initialDate = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const handleDateSelect = (date: string) => setSelectedDate(date);
  const handleOpenCalendar = () => setCalendarVisible(true);
  const handleCloseCalendar = () => setCalendarVisible(false);
  const user = useUser();

  const renderContent = () => {
    switch (activeTab) {
      case `Today's Activity`:
        return <HealthActivity />;

      case "Your Plan":
        return (
          <>
            {/* Pass selected date to Timeline */}
            <Timeline selectedDate={selectedDate} />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <GlassBackground>
      <CustomHeader />

      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Tabs */}
        <View
          style={[
            {
              backgroundColor: theme.violet,
              height: "30%",
              paddingHorizontal: 22,
            },
          ]}
        >
          <View
            style={[
              styles.tabContainer,
              {
                backgroundColor: theme.violetlight,
              },
            ]}
          >
            {[`Today's Activity`, "Your Plan"].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab as typeof activeTab)}
                style={[
                  styles.tab,
                  activeTab === tab && [
                    styles.activeTab,
                    { backgroundColor: theme.violet },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === tab ? theme.white : theme.violetdark,
                    },
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          {activeTab == "Today's Activity" && (
            <View
              style={{
                borderRadius: 20,
                zIndex: 10,
                marginTop: 5,
              }}
            >
              <HealthBanner userName={user.user?.name} />
            </View>
          )}

          {activeTab == "Your Plan" && (
            <View
              style={{
                backgroundColor: theme.violetlight,
                borderRadius: 20,
                // position: "relative",
                zIndex: 10,
                // paddingHorizontal: 22,
              }}
            >
              <HorizontalDateStrip
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                onOpenCalendar={handleOpenCalendar}
              />

              <BCalendar
                visible={calendarVisible}
                selectedDate={selectedDate}
                onDateChange={handleDateSelect}
                onClose={handleCloseCalendar}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>{renderContent()}</View>
      </View>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    padding: 5,
    borderRadius: 30,
    marginBottom: 20,
    marginTop: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    shadowColor: "#cc53e284",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 2 },
    elevation: 10,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: -55,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

export default TrackTabs;
