import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Loader } from '../components/ui';

import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EntryScreen from '../screens/EntryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Emoji tab icons keep us free of a native icon-font dependency.
const TAB_ICONS = {
  Home: '🏠',
  Progress: '📊',
  Log: '➕',
  History: '🗓️',
  Settings: '⚙️',
};

function TabIcon({ name, focused, color }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6, color }}>
      {TAB_ICONS[name]}
    </Text>
  );
}

function Tabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
      })}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      {/* Log is a shortcut: pressing it opens the Entry modal instead of
          rendering inline, so the save/goBack flow works cleanly. */}
      <Tab.Screen
        name="Log"
        component={DashboardScreen}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('Entry');
          },
        })}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { theme } = useTheme();
  const { loading, profile } = useApp();

  if (loading) return <Loader />;

  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  const navThemed = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  const onboarded = Boolean(profile?.onboardedAt);

  return (
    <NavigationContainer theme={navThemed}>
      <Stack.Navigator>
        {!onboarded ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Entry"
              component={EntryScreen}
              options={{
                title: 'Log study session',
                headerStyle: { backgroundColor: theme.card },
                headerTintColor: theme.text,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="MonthlyReport"
              component={MonthlyReportScreen}
              options={{
                title: 'Monthly report',
                headerStyle: { backgroundColor: theme.card },
                headerTintColor: theme.text,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
