import os
from fabric.api import local, run, cd, env, sudo, settings, lcd,prompt
from fabric.colors import red
from fabric.decorators import hosts

env.hosts = ['sama@tuteria.com']

password = os.getenv('PRODUCTION_PASSWORD', '')

@hosts("sama@tutor-search.tuteria.com")
def deploy_dev(build_no="latest"):
    code_dir = "/home/sama/development/tuteria-deploy"
    with settings(user="sama", password=password):
        with cd(code_dir):
            run("pwd")
            print(build_no)
            run("DEV_DEPLOY_VERSION={} docker-compose pull tutor-next".format(build_no))
            run("docker-compose up -d tutor-next")
            run('docker image prune -f')
            run('docker container prune -f')



def update_images(scale=1, celery=False, callback=None):
    with settings(user="sama",password=password):
        with cd("/home/sama/tuteria"):
            sudo('docker-compose pull app')
            if callback:
                callback()
                pass
            else:
                sudo('docker-compose up -d --scale app={} app'.format(scale))
                if celery:
                    sudo('docker-compose up -d --scale worker={} worker '.format(scale))
            sudo('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)')
            # sudo('docker rmi $(docker images -a -q)')

def deploy_next(user="sama", password=password):
    with settings(user="sama", password=password):
        with cd("/home/sama/web_deploy"):
            run('docker-compose pull tutor-next')
            run('docker-compose up -d tutor-next') 
            # run('docker-compose pull store-next')
            # run('docker-compose up -d store-next') 
            run('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)')
    

@hosts('sama@staging-prod.tuteria.com')
def deploy_staging():
    with cd('/home/sama/tuteria-codebase/tuteria-deploy'):
        run('docker-compose pull tutor-next')
        run('docker-compose up -d tutor-next')
    run('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)')    

@hosts('sama@tutor-search.tuteria.com')
def build_new_flow():
    with cd('/home/sama/tutor-frontend-app-v2'):
        run('git pull --no-edit')
        run('git checkout -f develop')
        # run('yarn install')
        # run('/home/sama/.nvm/versions/node/v8.9.4/bin/node build')
        run('docker login -u gbozee -p abiola2321 registry.gitlab.com')    
        run('docker build --no-cache -t registry.gitlab.com/tuteria/v2/tutor-frontend-app/tutor-application:latest .')
        run('docker push registry.gitlab.com/tuteria/v2/tutor-frontend-app/tutor-application:latest')
    run('docker rmi $(docker images --filter "dangling=true" -q --no-trunc)') 
