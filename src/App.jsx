import { useEffect, useState } from 'react'

function App() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('Loading...')

  async function loadItems() {
    try {
      const response = await fetch('/api/items')
      const data = await response.json()
      setItems(data)
      setMessage('')
    } catch (error) {
      setMessage('Could not reach the backend')
    }
  }

  async function addItem(event) {
    event.preventDefault()

    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })

    if (!response.ok) {
      const error = await response.json()
      setMessage(error.message)
      return
    }

    setName('')
    setDescription('')
    setMessage('Item added')
    loadItems()
  }

  async function deleteItem(id) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    loadItems()
  }

  useEffect(() => {
    loadItems()
  }, [])

  return (
    <main>
      <p className="eyebrow">Simple MERN starter</p>
      <h1>Booking</h1>
      <p className="lede">A plain React and Express app that is easy to change by hand.</p>

      <section>
        <h2>Add an item</h2>

        <form onSubmit={addItem}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <button type="submit">Add item</button>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="items">
          {items.map((item) => (
            <article key={item._id}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.description || 'No description'}</p>
              </div>
              <button className="delete" onClick={() => deleteItem(item._id)}>
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
