import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @desc    Get all protocol definitions
 * @route   GET /api/protocols
 * @access  Private
 */
export const getProtocols = async (req: Request, res: Response) => {
  // Because of the 'protect' middleware, we can safely access req.user here.
  console.log(`User ${req.user?.userId} with role ${req.user?.role} is fetching protocols.`);
  try {
    const protocols = await prisma.protocolDefinition.findMany({
      select: {
        id: true,
        title: true,
        description: true,
      },
    });
    res.status(200).json({ data: protocols });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get a single protocol by ID
 * @route   GET /api/protocols/:id
 * @access  Private
 */
export const getProtocolById = async (req: Request, res: Response) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    if (isNaN(protocolId)) {
      return res.status(400).json({ message: 'Invalid protocol ID' });
    }
    const protocol = await prisma.protocolDefinition.findUnique({
      where: { id: protocolId },
    });
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found' });
    }
    res.status(200).json(protocol);
  } catch (error) {
    console.error('Error fetching protocol by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Create a new protocol instance
 * @route   POST /api/protocols/:id/instances
 * @access  Private
 */
export const createProtocolInstance = async (req: Request, res: Response) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    const { patientIdentifier } = req.body;
    
    if (isNaN(protocolId)) {
      return res.status(400).json({ message: 'Invalid protocol ID' });
    }
    
    if (!patientIdentifier) {
      return res.status(400).json({ message: 'Patient identifier is required' });
    }

    const protocolInstance = await prisma.protocolInstance.create({
      data: {
        protocolDefinitionId: protocolId,
        hospitalId: req.user!.hospitalId || 1, // Default to hospital 1 if not set
        patientIdentifier,
        status: 'IN_PROGRESS',
      },
    });

    res.status(201).json({ data: protocolInstance });
  } catch (error) {
    console.error('Error creating protocol instance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Save protocol data
 * @route   POST /api/protocols/instances/:instanceId/data
 * @access  Private
 */
export const saveProtocolData = async (req: Request, res: Response) => {
  try {
    const instanceId = parseInt(req.params.instanceId, 10);
    const { stepId, value } = req.body;
    
    if (isNaN(instanceId)) {
      return res.status(400).json({ message: 'Invalid instance ID' });
    }
    
    if (!stepId || value === undefined) {
      return res.status(400).json({ message: 'Step ID and value are required' });
    }

    // Save the data
    const protocolData = await prisma.instanceData.create({
      data: {
        instanceId,
        stepId,
        value: JSON.stringify(value),
        authorId: req.user!.userId,
      },
    });

    // Update the instance status if needed
    await prisma.protocolInstance.update({
      where: { id: instanceId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ data: protocolData });
  } catch (error) {
    console.error('Error saving protocol data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get protocol instance data
 * @route   GET /api/protocols/instances/:instanceId/data
 * @access  Private
 */
export const getProtocolInstanceData = async (req: Request, res: Response) => {
  try {
    const instanceId = parseInt(req.params.instanceId, 10);
    
    if (isNaN(instanceId)) {
      return res.status(400).json({ message: 'Invalid instance ID' });
    }

    const instanceData = await prisma.instanceData.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'asc' },
    });

    // Parse the JSON values
    const parsedData = instanceData.map(data => ({
      ...data,
      value: JSON.parse(data.value),
    }));

    res.status(200).json({ data: parsedData });
  } catch (error) {
    console.error('Error fetching protocol instance data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get user's protocol instances
 * @route   GET /api/protocols/instances
 * @access  Private
 */
export const getUserProtocolInstances = async (req: Request, res: Response) => {
  try {
    const instances = await prisma.protocolInstance.findMany({
      where: {
        hospitalId: req.user!.hospitalId || 1,
      },
      include: {
        protocolDefinition: {
          select: {
            title: true,
            description: true,
          },
        },
        data: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({ data: instances });
  } catch (error) {
    console.error('Error fetching user protocol instances:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc    Get open protocols in hospital
 * @route   GET /api/protocols/open
 * @access  Private
 */
export const getOpenProtocols = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { role: true } 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Buscar protocolos em andamento do hospital do usuário
    const openProtocols = await prisma.protocolInstance.findMany({
      where: {
        hospitalId: user.hospitalId || 1,
        status: {
          in: ['IN_PROGRESS', 'PAUSED']
        }
      },
      include: {
        protocolDefinition: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        data: {
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1,
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({ protocols: openProtocols });
  } catch (error) {
    console.error('Error fetching open protocols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Assign protocol to user
 * @route   POST /api/protocols/instances/:instanceId/assign
 * @access  Private
 */
export const assignProtocolToUser = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const { userId: targetUserId } = req.body;
    const currentUserId = req.user!.userId;

    // Verificar se o protocolo existe
    const instance = await prisma.protocolInstance.findUnique({
      where: { id: parseInt(instanceId) },
      include: { collaborators: true }
    });

    if (!instance) {
      return res.status(404).json({ error: 'Protocol instance not found' });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Verificar se já é colaborador
    const existingCollaborator = await prisma.instanceCollaborator.findFirst({
      where: {
        instanceId: parseInt(instanceId),
        userId: targetUserId
      }
    });

    if (existingCollaborator) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Adicionar como colaborador
    await prisma.instanceCollaborator.create({
      data: {
        instanceId: parseInt(instanceId),
        userId: targetUserId
      }
    });

    res.json({ message: 'User assigned successfully' });
  } catch (error) {
    console.error('Error assigning protocol to user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @desc    Update protocol status
 * @route   PUT /api/protocols/instances/:instanceId/status
 * @access  Private
 */
export const updateProtocolStatus = async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const { status, outcome } = req.body;
    const userId = req.user!.userId;

    // Verificar se o usuário é colaborador
    const collaboration = await prisma.instanceCollaborator.findFirst({
      where: {
        instanceId: parseInt(instanceId),
        userId: userId
      }
    });

    if (!collaboration) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Atualizar status
    const updatedInstance = await prisma.protocolInstance.update({
      where: { id: parseInt(instanceId) },
      data: {
        status,
        outcome: outcome || null,
        updatedAt: new Date()
      },
      include: {
        protocolDefinition: true,
        collaborators: {
          include: {
            user: true
          }
        }
      }
    });

    res.json({ instance: updatedInstance });
  } catch (error) {
    console.error('Error updating protocol status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};