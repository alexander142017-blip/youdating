import React from "react";
import { Users, Heart, MessageCircle, Star } from "lucide-react";

export default function MatchesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white shadow-lg">
            <Users className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Matches</h1>
        <p className="text-xl text-gray-600">
          Connect with people who liked you back
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sample Match Cards */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 h-48 flex items-center justify-center">
              <Heart className="w-12 h-12 text-pink-300" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">Match {i}</h3>
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-gray-600 mb-4">
                You both liked each other! Start a conversation.
              </p>
              <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200">
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Send Message
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No More Matches?</h2>
        <p className="text-gray-600 mb-6">
          Keep swiping in Discover to find more potential matches!
        </p>
        <button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200">
          Go to Discover
        </button>
      </div>
    </div>
  );
}