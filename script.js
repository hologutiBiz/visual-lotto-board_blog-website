import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = "https://ghwweliuwimhjmaackuw.supabase.co";
// const SUPABASE_ANON_KEY = "sb_publishable_0A3YsqORsp17q2SNjoHubA__JHxdyp5";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdod3dlbGl1d2ltaGptYWFja3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzQyMDYsImV4cCI6MjA4NDQxMDIwNn0.9SgNKkYbUGrBN3lE3qP0osO9W-6EEcdQf930xTa_EGg"

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("newsletterForm");
const emailInput = document.getElementById("emailInput");
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById("btnText");
const messageBox = document.getElementById("messageBox");

function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.className =  `message ${type} show`;

    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 5000);
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    emailInput.disabled = isLoading;

    if (isLoading) {
        btnText.innerHTML = '<span class="spinner"></span>';
    } else {
        btnText.textContent = 'Subscribe'
    }
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

async function subscribeNewsletter(email) {
    try {
        //validate email
        if (!validateEmail(email)) {
            return {
                success: false,
                message: "Please enter a valid email address"
            };
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if already subscribed
        const { data: existing, error: checkError } = await supabase
            .from('newsletter_subscribers')
            .select('email, status')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existing) {
            if (existing.status === 'unsubscribed') {
                // Reactive subscription
                const { error: updateError } = await supabase
                    .from('newsletter_subscribers')
                    .update({
                        status: 'active',
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', normalizedEmail);

                if (updateError) throw updateError;

                return {
                    success: true,
                    message: 'Welcome back! Your subscription has been reactivated.'
                };
            }

            return {
                success: false,
                message: 'This email is already subscribed!'
            };
        }

        // Insert new subscriber
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert([
                {
                    email: normalizedEmail,
                    status: 'active',
                    source: window.location.pathname,
                    user_agent: navigator.userAgent
                }
            ])
            .select();

        if (error) {
            // Handle unique constraint violation
            if (error.code === '23505') {
                return {
                    success: false,
                    message: 'This email is already subscribed!'
                };
            }
            throw error;
        }

        return {
            success: true,
            message: 'Successfully subscribed! check your email for confirmation.',
            data: data[0]
        };

    } catch (error) {
        console.error('Subscription error: ', error);

        if (error.message.includes('fatch')) {
            return {
                success: false,
                message: 'Connection error. Please check your internet and try again.'
            };
        }

        return {
            success: false,
            message: 'Something wend wrong. Please try again later.'
        }
    }
}

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    setLoading(true);
    messageBox.classList.remove('show');

    // Subscribe
    const result = await subscribeNewsletter(email)

    setLoading(false);

    showMessage(result.message, result.success ? 'success' : 'error');

    if (result.success) {
        emailInput.value = '';
    }
});
