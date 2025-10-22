import React from "react";
import { MessageCircle, Send, Heart, Clock } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white shadow-lg">
            <MessageCircle className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-xl text-gray-600">
          Chat with your matches and build connections
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Recent Chats</h3>
            </div>
            <div className="p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Match {i}</h4>
                    <p className="text-sm text-gray-500 truncate">Hey! How are you?</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    2m
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border h-96 flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="font-bold text-gray-900">Start a conversation!</h3>
            </div>
            
            <div className="flex-1 p-4 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Select a match to start chatting</p>
              </div>
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-2 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-200">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}