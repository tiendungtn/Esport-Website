import React from 'react'

export function Tabs({ defaultValue, children }){
  const [value, setValue] = React.useState(defaultValue)
  const ctx = React.useMemo(()=>({value, setValue}), [value])
  return <TabsContext.Provider value={ctx}>
    <div>{children}</div>
  </TabsContext.Provider>
}

const TabsContext = React.createContext({ value: '', setValue: ()=>{} })

export function TabsList({ className='', children }){
  return <div className={className}>{children}</div>
}

export function TabsTrigger({ value, children }){
  const { value: v, setValue } = React.useContext(TabsContext)
  const active = v === value
  return (
    <button
      onClick={()=>setValue(value)}
      className={`px-3 py-1.5 rounded-lg text-sm transition border ${active ? 'bg-white/20 border-white/10' : 'border-transparent text-white/70 hover:text-white'}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value }){
  const { value: v } = React.useContext(TabsContext)
  if (v !== value) return null
  return <div className="mt-3"></div>
}
