// services/mockRoute.js
//
// Mock route with ~16 actual meaningful stops
// West Towne Mall → Union South
//

export const MOCK_ROUTE = [

  // 0 — Start: West Towne Mall
  {
    lat: 43.0592, lng: -89.5040,
    traffic: "light",
    weather: { condition: "Clear", description: "sunny", temperature: 23 }
  },

  // 1 — Gammon & Mineral Point intersection
  {
    lat: 43.0608, lng: -89.4976,
    traffic: "light",
    weather: { condition: "Clear", description: "sunny", temperature: 23 }
  },

  // 2 — Mineral Point Rd near West Towne Target
  {
    lat: 43.0614, lng: -89.4929,
    traffic: "moderate",
    weather: { condition: "Clouds", description: "partly cloudy", temperature: 22 }
  },

  // 3 — Mineral Point Rd near Hy-Vee
  {
    lat: 43.0620, lng: -89.4871,
    traffic: "moderate",
    weather: { condition: "Clouds", description: "partly cloudy", temperature: 22 }
  },

  // 4 — Mineral Point approaching Whitney Way
  {
    lat: 43.0627, lng: -89.4813,
    traffic: "heavy",
    weather: { condition: "Clouds", description: "cloudy", temperature: 21 }
  },

  // 5 — Whitney Way turn heading southeast
  {
    lat: 43.0652, lng: -89.4748,
    traffic: "heavy",
    weather: { condition: "Rain", description: "light rain", temperature: 20 }
  },

  // 6 — Mid-Whitney Way stretch
  {
    lat: 43.0667, lng: -89.4695,
    traffic: "heavy",
    weather: { condition: "Rain", description: "light rain", temperature: 19 }
  },

  // 7 — Whitney Way + Odana near Speedway Gas
  {
    lat: 43.0679, lng: -89.4643,
    traffic: "severe",
    weather: { condition: "Rain", description: "moderate rain", temperature: 18 }
  },

  // 8 — Odana Rd heading east
  {
    lat: 43.0685, lng: -89.4599,
    traffic: "severe",
    weather: { condition: "Rain", description: "heavy rain", temperature: 18 }
  },

  // 9 — Junction Rd / Tokay Blvd split area
  {
    lat: 43.0689, lng: -89.4520,
    traffic: "moderate",
    weather: { condition: "Rain", description: "heavy rain", temperature: 19 }
  },

  // 10 — Near Westmorland neighborhood
  {
    lat: 43.0687, lng: -89.4435,
    traffic: "moderate",
    weather: { condition: "Rain", description: "heavy rain", temperature: 20 }
  },

  // 11 — Mid-Regent St stretch
  {
    lat: 43.0700, lng: -89.4350,
    traffic: "moderate",
    weather: { condition: "Clouds", description: "clouds clearing", temperature: 20 }
  },

  // 12 — Regent St by Camp Randall Stadium
  {
    lat: 43.0707, lng: -89.4241,
    traffic: "heavy",
    weather: { condition: "Clouds", description: "overcast", temperature: 20 }
  },

  // 13 — Breese Terrace intersection
  {
    lat: 43.0709, lng: -89.4190,
    traffic: "moderate",
    weather: { condition: "Clouds", description: "cloudy", temperature: 21 }
  },

  // 14 — Almost Union South (Regent → Monroe split)
  {
    lat: 43.0711, lng: -89.4147,
    traffic: "light",
    weather: { condition: "Clouds", description: "clouds breaking", temperature: 22 }
  },

  // 15 — Final Stop: Union South
  {
    lat: 43.0715, lng: -89.4075,
    traffic: "smooth",
    weather: { condition: "Clear", description: "sunny", temperature: 23 }
  }

];
