import React from 'react'

export default function SectionHeader({title, action}){
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  )
}
