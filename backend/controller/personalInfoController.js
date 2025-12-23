import PersonalInfo from '../models/info.js';

// Get Personal Info
export const getPersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const personalInfo = await PersonalInfo.findOne({ userId });

    if (!personalInfo) {
      return res.status(404).json({
        success: false,
        message: 'Personal information not found',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: personalInfo,
    });
  } catch (error) {
    console.error('Error fetching personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal information',
      error: error.message,
    });
  }
};

// Update Personal Info
// Update Personal Info
export const updatePersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, dob, gender, address, phone, email } = req.body; // ← ADD email

    // Validate required fields
    if (!fullName || !dob || !address || !phone || !email) { // ← ADD email validation
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Update or create PersonalInfo
    const personalInfo = await PersonalInfo.findOneAndUpdate(
      { userId },
      {
        userId,
        fullName,
        dob: new Date(dob),
        gender,
        phone,
        email, // ← ADD THIS LINE
        address,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Personal information saved successfully',
      data: personalInfo,
    });
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personal information',
      error: error.message,
    });
  }
};