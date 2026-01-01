import { ExecutionContext } from '@nestjs/common'
import { AdminGatewayGuard } from '../src/auth/admin-gateway.guard'

class JwtStub {
  private payload: any
  constructor(payload: any) {
    this.payload = payload
  }
  verify(_: string) {
    return this.payload
  }
}

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp() {
      return {
        getRequest() {
          return { method: 'GET', headers }
        },
        getResponse() {
          return {}
        },
        getNext() {
          return {}
        },
      }
    },
    getClass() {
      return class {}
    },
    getHandler() {
      return function () {}
    },
    getArgs() {
      return []
    },
    getArgByIndex() {
      return null as any
    },
    switchToRpc() {
      return {} as any
    },
    switchToWs() {
      return {} as any
    },
    getType() {
      return 'http' as any
    },
  } as ExecutionContext
}

describe('AdminGatewayGuard', () => {
  it('allows uppercase ADMIN role', () => {
    const jwt = new JwtStub({ role: 'ADMIN' })
    const guard = new AdminGatewayGuard(jwt as any)
    const ctx = makeContext({ authorization: 'Bearer faketoken' })
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('allows lowercase admin role', () => {
    const jwt = new JwtStub({ role: 'admin' })
    const guard = new AdminGatewayGuard(jwt as any)
    const ctx = makeContext({ authorization: 'Bearer faketoken' })
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('allows roles array containing ADMIN', () => {
    const jwt = new JwtStub({ roles: ['EMPLOYEE', 'ADMIN'] })
    const guard = new AdminGatewayGuard(jwt as any)
    const ctx = makeContext({ authorization: 'Bearer faketoken' })
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it('forbids when no admin role present', () => {
    const jwt = new JwtStub({ role: 'EMPLOYEE' })
    const guard = new AdminGatewayGuard(jwt as any)
    const ctx = makeContext({ authorization: 'Bearer faketoken' })
    expect(() => guard.canActivate(ctx)).toThrow('Admin only')
  })
})
