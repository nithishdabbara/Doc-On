const axios = require('axios');
const xml2js = require('xml2js');

class MedlineService {
    constructor() {
        this.baseUrl = 'https://wsearch.nlm.nih.gov/ws/query';
        this.parser = new xml2js.Parser();
    }

    /**
     * Searches MedlinePlus for health topics.
     * @param {string} query - The medical term (e.g., "Asthma").
     * @returns {Promise<Array>} List of title and links.
     */
    async getTrustedSource(query) {
        if (!query) return [];

        try {
            // Using MedlinePlus Web Service
            const response = await axios.get(this.baseUrl, {
                params: {
                    db: 'healthTopics',
                    term: query,
                    retmax: 3 // Only top 3 results
                }
            });

            const result = await this.parser.parseStringPromise(response.data);

            // Navigate XML structure: nlmSearchResult -> list -> document
            const documents = result.nlmSearchResult.list?.[0]?.document;

            if (!documents) return [];

            return documents.map(doc => {
                // Extract clean title and URL
                const title = doc.content.find(c => c.$.name === 'title')?._;
                const url = doc.content.find(c => c.$.name === 'url')?._;
                const snippet = doc.content.find(c => c.$.name === 'FullSummary')?._; // Brief summary

                return {
                    source: "MedlinePlus (National Library of Medicine)",
                    title: title?.replace(/<[^>]*>/g, ''), // Strip HTML if any
                    url: url,
                    snippet: snippet?.replace(/<[^>]*>/g, '').substring(0, 150) + "..."
                };
            }).filter(item => item.title && item.url);

        } catch (error) {
            console.error("[MedlineService] Error:", error.message);
            return [];
        }
    }
}

module.exports = new MedlineService();
