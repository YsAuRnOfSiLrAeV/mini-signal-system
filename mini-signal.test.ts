import { signal, computed, effect } from './mini-signal'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function testSignalReadWrite(): void {
  const count = signal(1)

  assert(count.value === 1, 'signal should return initial value')

  count.value = 5

  assert(count.value === 5, 'signal should update stored value')
}

function testComputedAutoUpdates(): void {
  const count = signal(2)
  const doubled = computed(() => count.value * 2)

  assert(doubled.value === 4, 'computed should calculate initial value')

  count.value = 3

  assert(doubled.value === 6, 'computed should update when dependency changes')
}

function testEffectRerunsOnChange(): void {
  const count = signal(1)
  let runs = 0
  let lastSeen = 0

  effect(() => {
    runs += 1
    lastSeen = count.value
  })

  assert(runs === 1, 'effect should run immediately')
  assert(lastSeen === 1, 'effect should see initial value')

  count.value = 7

  assert(runs === 2, 'effect should rerun after signal change')
  assert(lastSeen === 7, 'effect should see updated value')
}

testSignalReadWrite()
testComputedAutoUpdates()
testEffectRerunsOnChange()

console.log('All tests passed')