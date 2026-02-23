const SUPABASE_URL = "https://cawtboppqqhmyffivvvz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhd3Rib3BwcXFobXlmZml2dnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTkyMTQsImV4cCI6MjA4NDY3NTIxNH0.UqEv9q_X8lIrkG9bpSywBQ6FgdD1R5ZgAV4_ohO_usE"; // Replace with your actual anon key

// Initialize Supabase
const SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const form = document.getElementById("newsletterForm");
const emailInput = document.getElementById("emailInput");
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const messageBox = document.getElementById('messageBox');

// Helper Functions
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.className = `message ${type} show`;
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
        btnText.textContent = 'Subscribe';
    }
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Main Subscription Function
async function subscribeNewsletter(email) {
    try {
        if (!validateEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }

        const normalizedEmail = email.toLowerCase().trim();

        const { data: existing, error: checkError } = await SUPABASE
            .from('newsletter_subscribers')
            .select('email, status')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existing) {
            if (existing.status === 'unsubscribed') {
                const { error: updateError } = await SUPABASE
                    .from('newsletter_subscribers')
                    .update({ status: 'active' })
                    .eq('email', normalizedEmail);

                if (updateError) throw updateError;
                return { success: true, message: '🎉 Welcome back! Your subscription has been reactivated.' };
            }
            return { success: false, message: '✓ This email is already subscribed!' };
        }

        const { data, error } = await SUPABASE
            .from('newsletter_subscribers')
            .insert([{
                email: normalizedEmail,
                status: 'active',
                source: window.location.pathname,
                user_agent: navigator.userAgent
            }])
            // .select();

        if (error) {
            if (error.code === '23505') {
                return { success: false, message: '✓ This email is already subscribed!' };
            }
            throw error;
        }

        return { success: true, message: '🎉 Successfully subscribed! Check your email for confirmation.' };

    } catch (error) {
        console.error('Subscription error:', error);
        return { success: false, message: 'Something went wrong. Please try again later.' };
    }
}

// Form Submission Handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    
    setLoading(true);
    messageBox.classList.remove('show');

    const result = await subscribeNewsletter(email);

    setLoading(false);
    showMessage(result.message, result.success ? 'success' : 'error');

    if (result.success) {
        emailInput.value = '';
    }
});

// console.log('📧 Newsletter form ready');