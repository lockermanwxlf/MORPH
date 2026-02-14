import { useEffect, useState } from "react"

export function useWASD() {
    const [keys, setKeys] = useState({
        w: false,
        a: false,
        s: false,
        d: false,
    })

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key.toLowerCase() in keys) {
                setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))
            }
        }

        function handleKeyUp(e: KeyboardEvent) {
            if (e.key.toLowerCase() in keys) {
                setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    return keys
}