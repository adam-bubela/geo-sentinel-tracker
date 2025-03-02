
// Service Worker for Geo Sentinel Tracker PWA

const CACHE_NAME = 'geo-sentinel-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Database for storing location data
let locationDB;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocationDatabase', 1);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'timestamp' });
      }
    };
    
    request.onsuccess = (event) => {
      locationDB = event.target.result;
      resolve(locationDB);
    };
  });
}

// Store location data in IndexedDB
function storeLocation(locationData) {
  return new Promise((resolve, reject) => {
    if (!locationDB) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = locationDB.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');
    const request = store.add(locationData);
    
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Get all stored locations
function getStoredLocations() {
  return new Promise((resolve, reject) => {
    if (!locationDB) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = locationDB.transaction(['locations'], 'readonly');
    const store = transaction.objectStore('locations');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Delete location from store after successful send
function deleteLocation(timestamp) {
  return new Promise((resolve, reject) => {
    if (!locationDB) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = locationDB.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');
    const request = store.delete(timestamp);
    
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Track location in the background
async function trackLocation() {
  try {
    await initDB();
    
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000
      });
    });
    
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    };
    
    await storeLocation(locationData);
    
    // Try to send the location data immediately if online
    if (navigator.onLine) {
      await syncLocations();
    } else {
      // Register for background sync
      self.registration.sync.register('sync-locations');
    }
    
    return locationData;
  } catch (error) {
    console.error('Background location tracking error:', error);
    throw error;
  }
}

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // Not in cache - return the result from the live server
        // and add it to the cache for future
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache GET requests
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          });
      })
      .catch((error) => {
        // Special handling for app URLs - show offline page
        console.log('Fetch failed:', error);
        // Could return a custom offline page here
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_TRACKING') {
    // Start location tracking in the background
    trackLocation()
      .then(location => {
        // Notify the client about the new location
        if (event.source) {
          event.source.postMessage({
            type: 'LOCATION_UPDATED',
            location: location
          });
        }
      })
      .catch(error => {
        console.error('Error tracking location:', error);
      });
  } else if (event.data && event.data.type === 'STOP_TRACKING') {
    // Stop any ongoing tracking
    console.log('Background tracking stopped');
  }
});

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncLocations());
  }
});

// Function to sync pending locations
const syncLocations = async () => {
  try {
    await initDB();
    const locations = await getStoredLocations();
    console.log(`Background sync: Found ${locations.length} locations to sync`);
    
    if (locations.length === 0) return;
    
    const API_ENDPOINT = self.API_ENDPOINT || "https://your-api-endpoint.com/locations";
    
    for (const location of locations) {
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: location.timestamp
            },
            timestamp: new Date().toISOString()
          }),
        });
        
        if (response.ok) {
          // Delete from store after successful send
          await deleteLocation(location.timestamp);
          console.log(`Location synced successfully: ${location.timestamp}`);
        } else {
          console.error(`Failed to sync location: ${response.status}`);
        }
      } catch (error) {
        console.error('Error syncing location:', error);
      }
    }
    
    // Notify all clients about the sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        count: locations.length
      });
    });
  } catch (error) {
    console.error('Background sync error:', error);
  }
};

// Setup periodic background sync if supported
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'geo-update') {
    event.waitUntil(trackLocation());
  }
});
