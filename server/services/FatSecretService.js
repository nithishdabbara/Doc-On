const axios = require('axios');
const qs = require('qs');

class FatSecretService {
    constructor() {
        this.token = null;
        this.tokenExpiresAt = 0;
        this.baseUrl = 'https://platform.fatsecret.com/rest/server.api';
    }

    async getAccessToken() {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token;
        }

        try {
            // Trim to avoid copy-paste whitespace errors
            const clientId = (process.env.FATSECRET_CLIENT_ID || '').trim();
            const clientSecret = (process.env.FATSECRET_CLIENT_SECRET || '').trim();

            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

            const response = await axios.post('https://oauth.fatsecret.com/connect/token',
                qs.stringify({ grant_type: 'client_credentials', scope: 'basic' }),
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log("!!! [FatSecret LOG] Raw Response:", JSON.stringify(response.data));

            this.token = response.data.access_token;
            // Set expiry slightly earlier than actual (usually 86400s) to be safe
            this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;
            return this.token;

        } catch (error) {
            console.error("[FatSecret] Auth Failed:", error.message);
            if (error.response) {
                console.error("[FatSecret] Details:", JSON.stringify(error.response.data));
            }
            return null;
        }
    }

    async searchFood(query) {
        if (!query) return null;

        const token = await this.getAccessToken();
        if (!token) return null;

        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    method: 'foods.search',
                    search_expression: query,
                    format: 'json',
                    max_results: 3
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const foods = response.data.foods?.food;
            if (!foods) return null;

            // Handle single object vs array return from XML-to-JSON-ish APIs
            const firstFood = Array.isArray(foods) ? foods[0] : foods;

            return {
                name: firstFood.food_name,
                description: firstFood.food_description, // e.g., "Per 100g - Calories: 52kcal | Fat: 0.17g | Carbs: 13.81g | Protein: 0.26g"
                url: firstFood.food_url
            };

        } catch (error) {
            console.error("[FatSecret] Search Failed:", error.message);
            return null;
        }
    }
}

module.exports = new FatSecretService();
