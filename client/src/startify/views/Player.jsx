import React from 'react'
import { useParams } from 'react-router-dom'
import { Trophy, Medal } from 'lucide-react'

export default function Player(){
  const { id } = useParams()
  return (
    <div className="container-xl py-8">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Player #{id}</h1>
        <p className="text-white/70">A simple player page with career highlights and recent results.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/5 rounded-xl p-4"><Trophy className="h-4 w-4 mb-2"/><div className="text-sm">Titles</div><div className="font-medium">7</div></div>
          <div className="bg-white/5 rounded-xl p-4"><Medal className="h-4 w-4 mb-2"/><div className="text-sm">Podiums</div><div className="font-medium">19</div></div>
          <div className="bg-white/5 rounded-xl p-4"><Medal className="h-4 w-4 mb-2"/><div className="text-sm">Win rate</div><div className="font-medium">62%</div></div>
        </div>
      </div>
    </div>
  )
}
