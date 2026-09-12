import { NextAuthOptions, AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import KeycloakProvider from 'next-auth/providers/keycloak'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { Role } from '@/generated/prisma/client'
import { resolveKeycloakRole } from './keycloak-roles'

function roleFromKeycloak(profile: unknown, accessToken?: string | null, idToken?: string | null): Role {
  return resolveKeycloakRole({
    profile: (profile ?? null) as Record<string, unknown> | null,
    accessToken,
    idToken,
  }) as Role
}

function keycloakConfigured(): boolean {
  return Boolean(
    process.env.KEYCLOAK_ID && process.env.KEYCLOAK_SECRET && process.env.KEYCLOAK_ISSUER,
  )
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Invalid credentials')
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      })

      if (!user || !user.password || user.isKeycloakUser || !user.isActive) {
        throw new Error('Invalid credentials')
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
      if (!isPasswordValid) {
        throw new Error('Invalid credentials')
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isKeycloakUser: user.isKeycloakUser,
      }
    },
  }),
]

function keycloakCallbackUrl(): string | undefined {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '')
  if (!base) return undefined
  return `${base}/api/auth/callback/keycloak`
}

if (keycloakConfigured()) {
  const callbackUrl = keycloakCallbackUrl()
  providers.unshift(
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: 'openid email profile',
          ...(callbackUrl ? { redirect_uri: callbackUrl } : {}),
        },
      },
      profile(profile) {
        const userRole = roleFromKeycloak(profile)
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          role: userRole,
          isKeycloakUser: true,
        }
      },
    }),
  )
}

export const authOptions: AuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'keycloak') {
        const userRole = roleFromKeycloak(profile, account.access_token, account.id_token)
        user.role = userRole

        try {
          let existingUser = await prisma.user.findUnique({
            where: { id: user.id! },
          })
          if (!existingUser && user.email) {
            existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            })
          }

          if (!existingUser) {
            await prisma.user.create({
              data: {
                id: user.id!,
                email: user.email!,
                name: user.name || 'User',
                role: userRole,
                isKeycloakUser: true,
              },
            })
          } else {
            user.id = existingUser.id
            if (existingUser.role !== userRole || !existingUser.isKeycloakUser) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  role: userRole,
                  isKeycloakUser: true,
                },
              })
            }
          }
        } catch (error) {
          console.error('Error in Keycloak signIn callback:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isKeycloakUser = user.isKeycloakUser
      }
      if (!token.id && token.sub) {
        token.id = token.sub
      }

      if (account?.provider === 'keycloak') {
        token.role = roleFromKeycloak(profile, account.access_token, account.id_token)
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string
        session.user.role = token.role as Role
        session.user.isKeycloakUser = token.isKeycloakUser as boolean
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch {
        return baseUrl
      }
      return baseUrl
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export { keycloakConfigured }
