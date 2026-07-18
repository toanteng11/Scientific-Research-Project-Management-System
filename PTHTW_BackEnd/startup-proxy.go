package main

import (
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"time"
)

const (
	backendAddress = "127.0.0.1:8080"
	startupTimeout  = 4 * time.Minute
)

func main() {
	java := exec.Command("/opt/java/openjdk/bin/java", "-jar", "/app/app.jar")
	java.Stdout = os.Stdout
	java.Stderr = os.Stderr
	if err := java.Start(); err != nil {
		log.Fatalf("start Spring Boot: %v", err)
	}

	go func() {
		if err := java.Wait(); err != nil {
			log.Fatalf("Spring Boot exited: %v", err)
		}
		log.Fatal("Spring Boot exited unexpectedly")
	}()

	target, err := url.Parse("http://" + backendAddress)
	if err != nil {
		log.Fatalf("parse backend URL: %v", err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		deadline := time.Now().Add(startupTimeout)
		for !backendReady() {
			if time.Now().After(deadline) {
				http.Error(w, "Spring Boot did not become ready in time", http.StatusServiceUnavailable)
				return
			}
			time.Sleep(250 * time.Millisecond)
		}
		proxy.ServeHTTP(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "80"
	}
	log.Printf("startup proxy listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func backendReady() bool {
	connection, err := net.DialTimeout("tcp", backendAddress, 250*time.Millisecond)
	if err != nil {
		return false
	}
	_ = connection.Close()
	return true
}
