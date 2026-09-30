pipeline {
    agent none

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
            steps {
                echo 'Installing Node.js dependencies using Node 16 Docker container...'
                sh '''
                    docker run --rm \
                        -u 1000:1000 \
                        -w /workspace/assessment2-pipeline \
                        -v /var/jenkins_home/workspace/assessment2-pipeline:/workspace/assessment2-pipeline:rw \
                        node:16.20.2-bookworm \
                        sh -c "node --version && npm --version && npm ci"
                '''
            }
        }

        stage('Run Tests') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
            steps {
                echo 'Running application tests using Node 16 Docker container...'
                sh '''
                    docker run --rm \
                        -u 1000:1000 \
                        -w /workspace/assessment2-pipeline \
                        -v /var/jenkins_home/workspace/assessment2-pipeline:/workspace/assessment2-pipeline:rw \
                        node:16.20.2-bookworm \
                        sh -c "node --version && npm --version && npm test"
                '''
            }
        }

        stage('Build Docker Image') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
            steps {
                echo 'Building Docker image...'
                sh 'docker build -t assessment2-node-app:${BUILD_NUMBER} .'
            }
        }

        stage('Run Docker Container') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
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
            agent any
            options {
                skipDefaultCheckout(true)
            }
            steps {
                echo 'Testing application running inside Docker...'
                sh 'curl -f http://docker:8081'
            }
        }

        stage('Security Scan') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
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
                        --format table \
                        --output /src/trivy-report.txt \
                        /src
                '''
            }
        }

        stage('Push Docker Image') {
            agent any
            options {
                skipDefaultCheckout(true)
            }
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
    }

    post {
        always {
            script {
                node {
                    echo 'Cleaning up Docker test container...'
                    sh 'docker rm -f assessment2-test-container || true'

                    archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        success {
            echo 'CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'CI/CD pipeline failed. Check the stage logs for details.'
        }
    }
}
