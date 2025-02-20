package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"strings"
	"time"

	"net/http"

	"github.com/gocolly/colly/v2"
)

func fetchProxies() []string {
	// Request to ProxyScrape API
	resp, err := http.Get("https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&county=US")
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	// Split the response into a slice of proxies
	proxies := strings.Split(string(body), "\n")
	return proxies
}

func randomProxy(proxies []string, r *rand.Rand) string {
	return proxies[r.Intn(len(proxies))]
}

// Random User-Agent for headers
var userAgents = []string{
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
}

func randomUserAgent() string {
	return userAgents[rand.Intn(len(userAgents))]
}

func main() {
	// Create or open the output file
	file, err := os.Create("output.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	// Instantiate the default collector
	c := colly.NewCollector(colly.AllowURLRevisit())

	proxies := fetchProxies()
	fmt.Println("Fetched", len(proxies), "proxies")
	fmt.Println(proxies)
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	proxified := randomProxy(proxies, r)

	fmt.Println("Using proxy:", proxified)

	c.SetProxy(proxified)

	// Set random User-Agent to avoid detection
	c.UserAgent = randomUserAgent()

	// Set headers to mimic a real browser
	c.OnRequest(func(r *colly.Request) {
		r.Headers.Set("Referer", "https://www.anothermag.com/")
		r.Headers.Set("Accept-Language", "en-US,en;q=0.9")
	})

	// Define what to scrape (e.g., links)
	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		// Extract the href attribute and write it to the file
		link := e.Attr("href")
		_, err := file.WriteString(link + "\n")
		if err != nil {
			log.Fatal(err)
		}
	})

	// Set a delay between requests to mimic human behavior
	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Delay:       2 * time.Second, // Delay between requests
		RandomDelay: 3 * time.Second, // Randomize the delay
	})

	// Log the proxy and response details
	c.OnResponse(func(r *colly.Response) {
		log.Printf("Proxy Address: %s\n", r.Request.ProxyURL)
		log.Printf("Response: %s\n", bytes.Replace(r.Body, []byte("\n"), nil, -1))
	})

	// Visit the page to scrape (use this URL as an example, replace it with your target)
	err = c.Visit("https://www.anothermag.com/")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Scraping complete, links saved to output.txt.")
}
