import { useEffect, useState } from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const webviewUrl = 'https://abhiruchicppmanojj.vercel.app/';

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const injectedCSS = `
    (function() {
      const style = document.createElement('style');
      style.innerHTML = '\n        html, body { box-sizing: border-box; padding-top: 24px !important; padding-bottom: 24px !important; }\n        header, .header, .site-header { position: relative !important; top: 0 !important; }\n        img { max-width: 160px !important; height: auto !important; }\n        .footer, footer { padding-bottom: 32px !important; }\n      ';
      document.head.appendChild(style);
    })(); true;
  `;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0 }]}> 
      <ExpoStatusBar style="light" hidden={false} translucent={false} />
      <WebView
        source={{ uri: webviewUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={["*"]}
        injectedJavaScript={injectedCSS}
        onLoadStart={() => setIsLoading(true)}
        onLoadProgress={(event) => {
          if (event.nativeEvent.progress > 0.3) {
            setIsLoading(false);
          }
        }}
        onLoadEnd={() => {
          setIsLoading(false);
          SplashScreen.hideAsync().catch(() => undefined);
        }}
        onError={() => {
          setIsLoading(false);
          SplashScreen.hideAsync().catch(() => undefined);
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
