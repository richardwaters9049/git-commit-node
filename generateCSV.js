const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

// Promisify the fs.writeFile function
const writeFileAsync = promisify(fs.writeFile);

// API endpoint
const url = 'https://api.github.com/repositories/19438/commits';

// Personal Access Token
const token = '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';

// Set headers with the PAT for authentication
const headers = {
    Authorization: `Bearer ${token}`,
};

async function fetchData() {
    try {
        // Make a GET request to the GitHub API with authentication
        const response = await axios.get(url, { headers });
        const commitsData = response.data;

        // Initialize arrays to store data
        const authorData = [];
        const followersData = [];
        const commitDetails = [];

        for (const commit of commitsData) {
            // Committer's details
            const author = commit.commit.author;
            const authorUsername = commit.author ? commit.author.login : '';
            const authorHomepage = commit.author ? commit.author.html_url : '';
            const avatarUrl = commit.author ? commit.author.avatar_url : '';
            authorData.push({
                'Author Name': author.name,
                'Author Username': authorUsername,
                'Author Homepage': authorHomepage,
                'Avatar URL': avatarUrl,
            });

            // Get the first five followers of the committer
            if (authorUsername) {
                const followersUrl = `https://api.github.com/users/${authorUsername}/followers`;
                const followersResponse = await axios.get(followersUrl, { headers });
                const followersList = followersResponse.data.slice(0, 5).map((follower) => follower.login);
                followersData.push({
                    'Author Username': authorUsername,
                    'Followers': followersList.join(', '),
                });
            } else {
                followersData.push({
                    'Author Username': authorUsername,
                    'Followers': 'No followers data available',
                });
            }

            // Commit details
            const repoUrl = commit.html_url.replace('/commit/', '');
            const commitUrl = commit.html_url;
            const lastCommentUrl = `${commitUrl}/comments`;
            const secondLastCommentUrl = `${commitUrl}/comments?page=2`;
            commitDetails.push({
                'Repo URL': repoUrl,
                'Last Comment URL': lastCommentUrl,
                '2nd Last Comment URL': secondLastCommentUrl,
            });
        }

        // Create a folder if it doesn't exist
        const folderPath = 'csv_files'; // Change to the desired folder name
        if (!fs.existsSync(folderPath)) {
            mkdirp.sync(folderPath);
            console.log(`Folder '${folderPath}' created.`);
        } else {
            console.log(`Folder '${folderPath}' already exists.`);
        }

        // Write data to CSV files in the folder
        await writeFileAsync(`${folderPath}/commit_authors.csv`, convertToCSV(authorData));
        await writeFileAsync(`${folderPath}/commit_followers.csv`, convertToCSV(followersData));
        await writeFileAsync(`${folderPath}/commit_details.csv`, convertToCSV(commitDetails));

        console.log('CSV files generated successfully.');
    } catch (error) {
        console.error('Failed to retrieve data from the GitHub API:', error);
    }
}

function convertToCSV(data) {
    const header = Object.keys(data[0]);
    const rows = data.map((obj) => header.map((key) => obj[key]));
    return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// Call the fetchData function to start the process
fetchData();
