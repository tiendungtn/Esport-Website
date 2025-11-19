import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
import { Gamepad2, Globe2, CalendarDays } from 'lucide-react'

export default function FilterBar(){
  return (
    <div>
      <Tabs defaultValue="upcoming">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <TabsList className="bg-white/5 rounded-xl p-1">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-3">
            <Select label="Game" icon={<Gamepad2 className="h-4 w-4"/>} options={["All","VALORANT","Dota 2","MLBB","PUBG"]}/>
            <Select label="Region" icon={<Globe2 className="h-4 w-4"/>} options={["All","APAC","EU","NA","SEA","Global"]}/>
            <Select label="Date" icon={<CalendarDays className="h-4 w-4"/>} options={["Any time","This week","This month"]}/>
          </div>
        </div>

        <TabsContent value="upcoming" />
        <TabsContent value="live" />
        <TabsContent value="past" />
      </Tabs>
    </div>
  )
}

function Select({ label, options, icon }){
  return (
    <label className="text-sm text-white/60 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
      {icon}
      <span>{label}:</span>
      <select className="bg-transparent outline-none text-white">
        {options.map(o => <option key={o} value={o} className="bg-[#0b0f14]">{o}</option>)}
      </select>
    </label>
  )
}
