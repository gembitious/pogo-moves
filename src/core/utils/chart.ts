// moves spread handler
export const spreadMoveChip = (move: HTMLDivElement, offset: number) => {
  if (!move.classList.contains('move-chip-spread')) {
    move.classList.add('move-chip-spread')
    move.style.zIndex = '5'
    move.style.top = `${Number(move.style.top.split('px')[0]) + offset}px`
    const t = setTimeout(() => rollbackMoveChip(move, offset), 2000)
  }
}

// spread moves rollback handler
export const rollbackMoveChip = (move: HTMLDivElement, offset: number) => {
  if (move.classList.contains('move-chip-spread')) {
    move.classList.remove('move-chip-spread')
    move.style.zIndex = '1'
    move.style.top = `${Number(move.style.top.split('px')[0]) - offset}px`
  }
}

// mouse move event handler
export const handleMoveChip = (e: MouseEvent, isClicked?: boolean) => {
  let elements = document.elementsFromPoint(e.clientX, e.clientY)
  const moves = elements.filter((e) => e.classList.contains('move-chip-point'))
  if (moves.length > 1) {
    moves.map((move, index) => {
      const moveElement = move.nextElementSibling
      if (moveElement instanceof HTMLDivElement) {
        const offset =
          moves.length > 1 ? (index - (moves.length - 1) / 2) * 18 /* chip height */ : 0
        spreadMoveChip(moveElement, offset)
      }
    })
  }
}
