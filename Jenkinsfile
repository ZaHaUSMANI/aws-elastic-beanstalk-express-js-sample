pipeline {
    agent none

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            agent {
               docker {
                   image 'node:16.20.2-bookworm'
                   reuseNode true
                }
            }
            steps {
                echo 'Installing Node.js dependencies using Node 16...'
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
            }
         }

        
        stage('Run Tests') {
            agent {
                docker {
                image 'node:16.20.2-bookworm'
                reuseNode true
                }
            }
            steps {
               echo 'Running application tests using Node 16...'
               sh 'node --version'
               sh 'npm test'
            }
        }  

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t assessment2-node-app:${BUILD_NUMBER} .'
            }
        }

        stage('Run Docker Container') {
            steps {
                echo 'Starting Docker container...'
                sh '''
                    docker rm -f assessment2-test-container || true
                    docker run -d --name assessment2-test-container -p 8081:8080 assessment2-node-app:${BUILD_NUMBER}
                    sleep 5
                '''
            }
        }

        stage('Test Docker Application') {
            steps {
                echo 'Testing application running inside Docker...'
                sh 'curl -f http://docker:8081'
            }
        }

        stage('Security Scan') {
            steps {
                echo 'Scanning project dependencies for High and Critical vulnerabilities...'
                sh '''
                    docker run --rm \
                        -v "$PWD:/src" \
                        aquasec/trivy:0.66.0 \
                        fs \
                        --scanners vuln \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        /src
                '''
            }
        }
        stage('Push Docker Image') {
            steps {
                echo 'Logging in to Docker Hub and pushing the image...'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

                        docker tag assessment2-node-app:${BUILD_NUMBER} "$DOCKERHUB_USERNAME/assessment2-node-app:${BUILD_NUMBER}"
                        docker tag assessment2-node-app:${BUILD_NUMBER} "$DOCKERHUB_USERNAME/assessment2-node-app:latest"

                        docker push "$DOCKERHUB_USERNAME/assessment2-node-app:${BUILD_NUMBER}"
                        docker push "$DOCKERHUB_USERNAME/assessment2-node-app:latest"

                        docker logout
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Cleaning up Docker container...'
                sh 'docker rm -f assessment2-test-container || true'
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'CI/CD pipeline failed. Check the stage logs for details.'
        }
    }
}
