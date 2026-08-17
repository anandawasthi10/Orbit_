import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Member from '@/models/Member';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        await connectDB();

        const member = await Member.findOne({
          email: credentials.email.toLowerCase().trim(),
        });

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
  cookies: {
    sessionToken: {
      name: 'orbit.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl && !user.avatarUrl.startsWith('data:') ? user.avatarUrl : '';
        token.profileComplete = user.profileComplete;
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
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.role = token.role || 'Team Member';
        session.user.avatarUrl = token.avatarUrl || '';
        session.user.profileComplete = token.profileComplete;
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
