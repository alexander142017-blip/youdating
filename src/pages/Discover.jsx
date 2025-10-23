import React from "react";
import { Compass, Heart, X, Star, MapPin, Camera } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white shadow-lg">
            <Compass className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover</h1>
        <p className="text-xl text-gray-600">
          Swipe through nearby profiles and find your perfect match
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Swipe Area */}
        <div className="lg:col-span-2">
          <div className="relative max-w-md mx-auto">
            {/* Profile Card Stack */}
            <div className="relative">
              {/* Top Card */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white relative z-10">
                <div className="aspect-[3/4] bg-gradient-to-br from-pink-100 to-rose-100 relative flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                    <p className="text-lg font-medium text-gray-600">Profile Photo</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">Sarah, 24</h3>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">2 miles away</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Love hiking, coffee shops, and weekend adventures. Looking for someone to explore the city with!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">Photography</span>
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">Hiking</span>
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">Coffee</span>
                  </div>
                </div>
              </div>

              {/* Background Cards */}
              <div className="absolute inset-0 bg-white rounded-3xl shadow-xl transform rotate-2 scale-95 -z-10"></div>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-lg transform -rotate-1 scale-90 -z-20"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8">
              <button className="w-16 h-16 bg-white rounded-full shadow-lg border-2 border-red-200 flex items-center justify-center hover:border-red-300 hover:shadow-xl transition-all duration-200 group">
                <X className="w-8 h-8 text-red-500 group-hover:text-red-600" />
              </button>
              
              <button className="w-12 h-12 bg-white rounded-full shadow-lg border-2 border-blue-200 flex items-center justify-center hover:border-blue-300 hover:shadow-xl transition-all duration-200 group">
                <Star className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
              </button>
              
              <button className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg flex items-center justify-center hover:from-pink-600 hover:to-rose-600 hover:shadow-xl transition-all duration-200 group">
                <Heart className="w-8 h-8 text-white" />
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm">
                Swipe left to pass • Tap star for Super Like • Swipe right to like
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Today&apos;s Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profiles seen</span>
                <span className="font-bold text-pink-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Likes given</span>
                <span className="font-bold text-pink-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Super Likes left</span>
                <span className="font-bold text-pink-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New matches</span>
                <span className="font-bold text-pink-600">2</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Discovery Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range: 18-35
                </label>
                <input type="range" className="w-full accent-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance: 25 miles
                </label>
                <input type="range" className="w-full accent-pink-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Show me</span>
                <select className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>Everyone</option>
                  <option>Women</option>
                  <option>Men</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Add more photos to increase matches by 40%</li>
              <li>• Write a compelling bio to stand out</li>
              <li>• Use Super Likes on profiles you really love</li>
              <li>• Stay active to boost your visibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
