import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        isGoogleAuth: { label: 'isGoogleAuth', type: 'text' },
        name: { label: 'Name', type: 'text' },
        avatarUrl: { label: 'AvatarUrl', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Please enter an email address');
        }

        const inputEmail = credentials.email.toLowerCase().trim();

        await connectDB();

        let member = await Member.findOne({
          email: inputEmail,
        });

        // 1. Google OAuth Authenticated Flow (Firebase Auth integration)
        if (credentials.isGoogleAuth === 'true' || (credentials as any).isGoogleAuth === true) {
          if (!member) {
            const defaultRole = inputEmail === 'anandawasthi610@gmail.com' ? 'Admin' : 'Team Member';
            member = await Member.create({
              name: credentials.name || inputEmail.split('@')[0],
              email: inputEmail,
              role: defaultRole,
              avatarUrl: credentials.avatarUrl || '',
              profileComplete: true,
            });
          } else if (credentials.avatarUrl && !member.avatarUrl) {
            await Member.findByIdAndUpdate(member._id || member.id, {
              avatarUrl: credentials.avatarUrl,
            });
          }

          const userId = member._id ? member._id.toString() : member.id;
          let avatarUrl = member.avatarUrl || credentials.avatarUrl || '';
          if (avatarUrl.startsWith('data:')) {
            avatarUrl = '';
          }

          return {
            id: userId,
            name: member.name || credentials.name || inputEmail.split('@')[0],
            email: member.email,
            role: member.role || (inputEmail === 'anandawasthi610@gmail.com' ? 'Admin' : 'Team Member'),
            avatarUrl: avatarUrl,
            profileComplete: member.profileComplete ?? true,
          };
        }

        // 2. Standard Email + Password Credentials Flow
        if (!credentials?.password) {
          throw new Error('Please enter your password');
        }

        if (!member || !member.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          member.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        const userId = member._id ? member._id.toString() : member.id;

        // Ensure avatarUrl in token is never a base64 string
        let avatarUrl = member.avatarUrl || '';
        if (avatarUrl.startsWith('data:')) {
          avatarUrl = '';
        }

        return {
          id: userId,
          name: member.name,
          email: member.email,
          role: member.role || 'Team Member',
          avatarUrl: avatarUrl,
          profileComplete: member.profileComplete ?? false,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl && !(user as any).avatarUrl.startsWith('data:') ? (user as any).avatarUrl : '';
        token.profileComplete = (user as any).profileComplete;
      }
      if (trigger === 'update' && session) {
        const updatePayload = session.user || session;
        if (updatePayload.name) token.name = updatePayload.name;
        if (updatePayload.role) token.role = updatePayload.role;
        if (updatePayload.avatarUrl !== undefined) {
          token.avatarUrl =
            updatePayload.avatarUrl && !updatePayload.avatarUrl.startsWith('data:')
              ? updatePayload.avatarUrl
              : '';
        }
        if (updatePayload.profileComplete !== undefined) {
          token.profileComplete = updatePayload.profileComplete;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.name = token.name;
        (session.user as any).role = (token as any).role || 'Team Member';
        (session.user as any).avatarUrl = (token as any).avatarUrl || '';
        (session.user as any).profileComplete = (token as any).profileComplete;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  secret: process.env.NEXTAUTH_SECRET || 'orbit-super-secret-key-1234567890-v2',
};
